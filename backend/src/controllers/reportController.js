const prisma = require('../config/db');
const { analyzeImage } = require('../services/aiAnalysisService');
const { sendCitizenReportSubmittedEmail, sendAdminNewReportEmail, sendHighPriorityAdminEmail } = require('../services/emailService');

// Submit new road damage report
const createReport = async (req, res, next) => {
  try {
    const { latitude, longitude, user_notes, address: bodyAddress } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Road damage image is required' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'GPS location (latitude and longitude) is required' });
    }

    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);

    if (isNaN(latVal) || isNaN(lngVal)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude values' });
    }

    // 1. Reverse Geocode using OpenStreetMap Nominatim API if address not provided
    let address = bodyAddress || '';
    if (!address) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latVal}&lon=${lngVal}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'SmartRoadDamageReporter/1.0',
            },
          }
        );
        if (response.ok) {
          const geoData = await response.json();
          address = geoData.display_name || '';
        }
      } catch (err) {
        console.error('Reverse geocoding failed:', err.message);
      }
    }

    // 2. Perform AI Gemini Analysis
    const aiResult = await analyzeImage(req.file.path, user_notes);

    // Convert optimized image to base64 and clean up temporary file
    let imageUrl = '';
    try {
      const fs = require('fs');
      if (req.file && req.file.path) {
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Data = imageBuffer.toString('base64');
        imageUrl = `data:image/jpeg;base64,${base64Data}`;
        
        // Clean up the temporary file from the local disk asynchronously
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete temporary upload file:', err.message);
        });
      } else {
        imageUrl = `/uploads/${req.file.filename}`;
      }
    } catch (err) {
      console.error('Failed to convert image to base64:', err.message);
      // Fallback to local path if base64 conversion fails
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // 3. Write to Database transactionally
    const result = await prisma.$transaction(async (tx) => {
      // Create report
      const report = await tx.report.create({
        data: {
          userId: req.user.id,
          imageUrl,
          latitude: latVal,
          longitude: lngVal,
          address: address || 'Unknown Location',
          damageType: aiResult.damage_type,
          severity: aiResult.severity,
          priority: aiResult.priority,
          aiDescription: aiResult.description,
          userNotes: user_notes || '',
          status: 'Pending',
          adminRemarks: aiResult.failed ? 'AI analysis failed — needs manual review' : null,
        },
      });

      // Write initial history record (oldStatus: null -> newStatus: "Pending")
      await tx.reportStatusHistory.create({
        data: {
          reportId: report.id,
          oldStatus: null,
          newStatus: 'Pending',
          remarks: 'Report submitted by citizen and queued for review.',
        },
      });

      // Get reporter user name
      const citizen = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { name: true, email: true },
      });
      const citizenName = citizen?.name || 'A citizen';
      const citizenEmail = citizen?.email;

      // Find all admins
      const admins = await tx.user.findMany({
        where: { role: 'admin' },
        select: { id: true },
      });

      // Create notifications for all admins
      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: 'New Road Damage Report',
            message: `${citizenName} reported a new ${aiResult.damage_type} at ${address || 'Unknown Location'}.`,
          })),
        });
      }

      return { report, citizenName, citizenEmail };
    });

    const { report, citizenName, citizenEmail } = result;

    // Asynchronously send emails (errors won't block API response)
    if (citizenEmail) {
      sendCitizenReportSubmittedEmail(citizenEmail, citizenName, report)
        .catch((err) => console.error('[EMAIL ERROR] Failed sending citizen submission confirmation:', err.message));
    }

    sendAdminNewReportEmail(report, citizenName)
      .catch((err) => console.error('[EMAIL ERROR] Failed sending admin notification email:', err.message));

    if (report.priority === 'High') {
      sendHighPriorityAdminEmail(report, citizenName)
        .catch((err) => console.error('[EMAIL ERROR] Failed sending high-priority admin alert:', err.message));
    }

    res.status(201).json({
      message: 'Report submitted successfully',
      report,
    });
  } catch (error) {
    next(error);
  }
};

// List current citizen's reports
const getMyReports = async (req, res, next) => {
  try {
    const { status } = req.query;

    const queryFilters = {
      userId: req.user.id,
    };

    if (status) {
      const normalizedStatus = status.trim().replace(/\s+/g, '_');
      if (normalizedStatus.toLowerCase() === 'in_review') {
        queryFilters.status = 'In_Review';
      } else if (normalizedStatus.toLowerCase() === 'in_progress') {
        queryFilters.status = 'In_Progress';
      } else {
        queryFilters.status = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
      }
    }

    const reports = await prisma.report.findMany({
      where: queryFilters,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(reports);
  } catch (error) {
    next(error);
  }
};

// Get single report detail (with history timeline) for the citizen
const getReportById = async (req, res, next) => {
  try {
    const reportId = parseInt(req.params.id);

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        statusHistory: {
          orderBy: {
            changedAt: 'asc',
          },
          include: {
            user: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Citizens can only view their own reports
    if (report.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this report' });
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const reportId = parseInt(req.params.id);
    const { userNotes } = req.body;

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Authorization check
    if (report.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const dataToUpdate = {};
    if (userNotes !== undefined) {
      dataToUpdate.userNotes = userNotes;
    }

    // Handle multiple uploaded images
    if (req.processedFiles && req.processedFiles.length > 0) {
      const fs = require('fs');
      const base64Urls = [];
      for (const file of req.processedFiles) {
        try {
          if (file.path) {
            const imageBuffer = fs.readFileSync(file.path);
            const base64Data = imageBuffer.toString('base64');
            base64Urls.push(`data:image/jpeg;base64,${base64Data}`);
            
            // Clean up the temporary file from the local disk asynchronously
            fs.unlink(file.path, (err) => {
              if (err) console.error('Failed to delete temporary update file:', err.message);
            });
          } else {
            base64Urls.push(file.imageUrl);
          }
        } catch (err) {
          console.error('Failed to convert update image to base64:', err.message);
          // Fallback to local path if base64 conversion fails
          base64Urls.push(file.imageUrl);
        }
      }
      const newUrls = base64Urls.join(',');
      dataToUpdate.imageUrl = report.imageUrl ? `${report.imageUrl},${newUrls}` : newUrls;
    }

    const updatedReport = await prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id: reportId },
        data: dataToUpdate,
      });

      // Add status history record for the edit action
      await tx.reportStatusHistory.create({
        data: {
          reportId: updated.id,
          oldStatus: report.status,
          newStatus: report.status,
          changedBy: req.user.id,
          remarks: 'Report updated by citizen (notes or images updated).',
        },
      });

      return updated;
    });

    res.json({
      message: 'Report updated successfully',
      report: updatedReport,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    const reportId = parseInt(req.params.id);

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Authorization check: only owner or admin can delete
    if (report.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete the report from DB
    await prisma.report.delete({
      where: { id: reportId },
    });

    // Delete local image files
    if (report.imageUrl) {
      const fs = require('fs');
      const path = require('path');
      const imageUrls = report.imageUrl.split(',');
      for (const url of imageUrls) {
        const filePath = path.join(__dirname, '..', '..', url);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error(`Failed to delete local file ${filePath}:`, err.message);
          }
        }
      }
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getMyReports,
  getReportById,
  updateReport,
  deleteReport,
};
