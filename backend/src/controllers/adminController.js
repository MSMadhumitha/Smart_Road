const prisma = require('../config/db');
const { sendCitizenStatusUpdateEmail, sendCitizenResolutionEmail } = require('../services/emailService');

// Map incoming status filter string to Prisma Enum keys
const mapStatusQueryToEnum = (statusStr) => {
  if (!statusStr) return undefined;
  const cleaned = statusStr.trim().replace(/\s+/g, '_'); // "In Review" -> "In_Review"
  // Normalize checking casing
  if (cleaned.toLowerCase() === 'in_review') return 'In_Review';
  if (cleaned.toLowerCase() === 'in_progress') return 'In_Progress';

  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

// Map status enum to database string representation if needed
const mapEnumToStatusString = (enumVal) => {
  if (enumVal === 'In_Review') return 'In Review';
  if (enumVal === 'In_Progress') return 'In Progress';
  return enumVal;
};

// Admin list and filter reports
const getAdminReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, severity, priority, damageType, search, startDate, endDate } = req.query;

    const whereClause = {};

    if (status) {
      whereClause.status = mapStatusQueryToEnum(status);
    }
    if (severity) {
      whereClause.severity = severity;
    }
    if (priority) {
      whereClause.priority = priority;
    }
    if (damageType) {
      whereClause.damageType = damageType;
    }

    // Search query for address, notes, or descriptions
    if (search) {
      whereClause.OR = [
        { address: { contains: search } },
        { userNotes: { contains: search } },
        { aiDescription: { contains: search } },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Adjust to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    // Get total count
    const total = await prisma.report.count({ where: whereClause });

    // Fetch reports
    const reports = await prisma.report.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      reports,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

// Admin get single report detail (includes citizen profile details & history log)
const getAdminReportById = async (req, res, next) => {
  try {
    const reportId = parseInt(req.params.id);

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
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

    res.json(report);
  } catch (error) {
    next(error);
  }
};

// Admin update report status & add remarks
const updateReportStatus = async (req, res, next) => {
  try {
    const reportId = parseInt(req.params.id);
    const { status, remarks } = req.body;

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const targetStatus = mapStatusQueryToEnum(status);
    const validStatuses = ['Pending', 'Inspected', 'In_Review', 'In_Progress', 'Resolved', 'Rejected'];

    if (!validStatuses.includes(targetStatus)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Get current report
    const currentReport = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!currentReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // If status is the same, verify if remarks updated, or just do the update anyway
    const oldStatusStr = mapEnumToStatusString(currentReport.status);
    const newStatusStr = mapEnumToStatusString(targetStatus);

    const updatedReport = await prisma.$transaction(async (tx) => {
      const isResolved = targetStatus === 'Resolved';

      // Update Report
      const report = await tx.report.update({
        where: { id: reportId },
        data: {
          status: targetStatus,
          adminRemarks: remarks || null,
          resolvedAt: isResolved ? new Date() : null,
        },
      });

      // Insert status history entry
      await tx.reportStatusHistory.create({
        data: {
          reportId: report.id,
          oldStatus: oldStatusStr,
          newStatus: newStatusStr,
          changedBy: req.user.id,
          remarks: remarks || `Status changed from ${oldStatusStr} to ${newStatusStr}.`,
        },
      });

      // Create notification for the citizen who reported it
      await tx.notification.create({
        data: {
          userId: report.userId,
          title: 'Report Status Updated',
          message: `Your reported road damage #${report.id} status has been updated to "${newStatusStr}" by city administration.`,
        },
      });

      // Get citizen details
      const citizen = await tx.user.findUnique({
        where: { id: report.userId },
        select: { email: true, name: true },
      });

      return { report, citizenEmail: citizen?.email, citizenName: citizen?.name };
    });

    const { report, citizenEmail, citizenName } = updatedReport;

    // Asynchronously send status update emails
    if (citizenEmail) {
      if (targetStatus === 'Resolved') {
        sendCitizenResolutionEmail(citizenEmail, report, remarks)
          .catch((err) => console.error('[EMAIL ERROR] Failed sending citizen resolution confirmation:', err.message));
      } else {
        sendCitizenStatusUpdateEmail(citizenEmail, report, oldStatusStr, newStatusStr, remarks)
          .catch((err) => console.error('[EMAIL ERROR] Failed sending citizen status update notification:', err.message));
      }
    }

    res.json({
      message: 'Report status updated successfully',
      report,
    });
  } catch (error) {
    next(error);
  }
};

// Admin Dashboard Analytics
const getAdminAnalytics = async (req, res, next) => {
  try {
    // 1. Total reports count
    const totalReports = await prisma.report.count();

    // 2. Status counts
    const statusCounts = await prisma.report.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    // 3. Severity counts
    const severityCounts = await prisma.report.groupBy({
      by: ['severity'],
      _count: {
        id: true,
      },
    });

    // 4. Priority counts
    const priorityCounts = await prisma.report.groupBy({
      by: ['priority'],
      _count: {
        id: true,
      },
    });

    // 5. Damage type counts
    const damageTypeCounts = await prisma.report.groupBy({
      by: ['damageType'],
      _count: {
        id: true,
      },
    });

    // 6. Trend over time (daily report counts for the last 14 days)
    const trendData = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await prisma.report.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Format date label e.g., "Aug 24"
      const dateLabel = startOfDay.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      trendData.push({
        date: dateLabel,
        count,
      });
    }

    // Format output data groups for easier consumption by Recharts
    const statusFormatted = statusCounts.reduce((acc, curr) => {
      acc[mapEnumToStatusString(curr.status)] = curr._count.id;
      return acc;
    }, {});

    const severityFormatted = severityCounts.reduce((acc, curr) => {
      acc[curr.severity] = curr._count.id;
      return acc;
    }, {});

    const priorityFormatted = priorityCounts.reduce((acc, curr) => {
      acc[curr.priority] = curr._count.id;
      return acc;
    }, {});

    const damageTypeFormatted = damageTypeCounts.reduce((acc, curr) => {
      acc[curr.damageType] = curr._count.id;
      return acc;
    }, {});

    res.json({
      summary: {
        totalReports,
        status: statusFormatted,
        severity: severityFormatted,
        priority: priorityFormatted,
        damageType: damageTypeFormatted,
      },
      trend: trendData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminReports,
  getAdminReportById,
  updateReportStatus,
  getAdminAnalytics,
};
