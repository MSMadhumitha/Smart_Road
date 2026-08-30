require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// Upload Directory
// ==========================================

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || './uploads'
);

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}

console.log(`Upload directory: ${uploadDir}`);

// ==========================================
// Middleware
// ==========================================

// Enable CORS
app.use(cors());

// Body parsing
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);

// ==========================================
// Serve Uploaded Images
// ==========================================

app.use(
  '/uploads',
  express.static(uploadDir)
);

// ==========================================
// API Routes
// ==========================================

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/reports',
  reportRoutes
);

app.use(
  '/api/admin',
  adminRoutes
);

app.use(
  '/api/notifications',
  notificationRoutes
);

// ==========================================
// Health Check
// ==========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date()
  });
});

// ==========================================
// Root Route
// ==========================================

app.get('/', (req, res) => {
  res.send(
    'Smart Road Damage Reporting API is running.'
  );
});

// ==========================================
// Error Handler
// ==========================================

app.use(errorHandler);

// ==========================================
// Start Server
// ==========================================

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT}`
  );

  console.log(
    `Serving uploaded files from: ${uploadDir}`
  );
});