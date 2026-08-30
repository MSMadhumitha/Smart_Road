const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Upload directory
const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || './uploads'
);

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

console.log(`Upload directory: ${uploadDir}`);

// Multer storage configuration
// Memory storage is used because Sharp processes the image buffer
const storage = multer.memoryStorage();

// Allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;

  const mimetype = allowedTypes.test(
    file.mimetype.toLowerCase()
  );

  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (mimetype && extname) {
    return cb(null, true);
  }

  cb(
    new Error(
      'Only image files (jpg, jpeg, png, webp) are allowed!'
    )
  );
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Resize and compress single uploaded image
const resizeAndCompressImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const uniqueSuffix = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    const filename = `report-${uniqueSuffix}.jpg`;

    const destPath = path.join(uploadDir, filename);

    // Resize and compress image
    await sharp(req.file.buffer)
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 80
      })
      .toFile(destPath);

    // Attach processed file information
    req.file.filename = filename;
    req.file.path = destPath;

    // URL that can be stored in database
    req.file.imageUrl = `/uploads/${filename}`;

    console.log(`Image saved: ${destPath}`);

    next();
  } catch (error) {
    console.error(
      'Error processing image with Sharp:',
      error
    );

    next(
      new Error('Failed to process image file.')
    );
  }
};

// Resize and compress multiple uploaded images
const resizeAndCompressMultipleImages = async (
  req,
  res,
  next
) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    req.processedFiles = [];

    for (const file of req.files) {
      const uniqueSuffix = `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}`;

      const filename = `report-${uniqueSuffix}.jpg`;

      const destPath = path.join(
        uploadDir,
        filename
      );

      await sharp(file.buffer)
        .resize({
          width: 1600,
          height: 1600,
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 80
        })
        .toFile(destPath);

      req.processedFiles.push({
        filename: filename,
        path: destPath,
        imageUrl: `/uploads/${filename}`
      });

      console.log(`Image saved: ${destPath}`);
    }

    next();
  } catch (error) {
    console.error(
      'Error processing images with Sharp:',
      error
    );

    next(
      new Error('Failed to process image files.')
    );
  }
};

module.exports = {
  uploadImage: upload.single('image'),
  uploadImages: upload.array('images', 5),
  resizeAndCompressImage,
  resizeAndCompressMultipleImages
};