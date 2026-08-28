const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration using memory storage so we can process with sharp
const storage = multer.memoryStorage();

// Allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed!'));
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Middleware to resize and compress uploaded image
const resizeAndCompressImage = async (req, res, next) => {
  if (!req.file) {
    return next(); // Let controller handle missing file if it's required
  }

  try {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `report-${uniqueSuffix}.jpg`;
    const destPath = path.join(uploadDir, filename);

    // Process image using sharp: resize to max 1600px on the longest edge, compress to 80% quality JPEG
    await sharp(req.file.buffer)
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(destPath);

    // Attach local info to req.file so subsequent controllers can access it
    req.file.filename = filename;
    req.file.path = destPath;

    next();
  } catch (error) {
    console.error('Error processing image with sharp:', error);
    next(new Error('Failed to process image file.'));
  }
};

// Middleware to resize and compress multiple uploaded images
const resizeAndCompressMultipleImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    req.processedFiles = [];
    for (const file of req.files) {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `report-${uniqueSuffix}.jpg`;
      const destPath = path.join(uploadDir, filename);

      await sharp(file.buffer)
        .resize({
          width: 1600,
          height: 1600,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(destPath);

      req.processedFiles.push({
        filename,
        path: destPath,
        imageUrl: `/uploads/${filename}`,
      });
    }
    next();
  } catch (error) {
    console.error('Error processing images with sharp:', error);
    next(new Error('Failed to process image files.'));
  }
};

module.exports = {
  uploadImage: upload.single('image'),
  uploadImages: upload.array('images', 5),
  resizeAndCompressImage,
  resizeAndCompressMultipleImages,
};
