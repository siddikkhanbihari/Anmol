// ANMOL STORE - Express Application Setup
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { upload } from './middleware/upload.js';
import { authenticateToken } from './middleware/auth.js';
import { ApiResponse } from './utils/apiResponse.js';
import { Media } from './models/index.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import riderRoutes from './routes/riderRoutes.js';
import otpRoutes from './routes/otpRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security & Parsing Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible CDN font/script loading for local dev
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin: true, // Echo origin to allow requests from local dev servers & frontends
    credentials: true
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting on API endpoints
app.use('/api/', apiLimiter);

// File Upload Endpoint: Saves to disk AND syncs to MongoDB Atlas Cloud for universal device access
app.post('/api/v1/upload', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return ApiResponse.badRequest(res, 'No file uploaded');
  }

  try {
    let fileBuffer = req.file.buffer;
    if (!fileBuffer && req.file.path && fs.existsSync(req.file.path)) {
      fileBuffer = fs.readFileSync(req.file.path);
    }

    if (fileBuffer) {
      await Media.findOneAndUpdate(
        { filename: req.file.filename },
        {
          filename: req.file.filename,
          contentType: req.file.mimetype || 'image/jpeg',
          data: fileBuffer,
          size: fileBuffer.length
        },
        { upsert: true, new: true }
      );
    }
  } catch (mediaErr) {
    console.warn('[Upload] Notice: Could not sync image to MongoDB Atlas Media:', mediaErr.message);
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  return ApiResponse.created(res, { url: fileUrl, filename: req.file.filename }, 'Image uploaded successfully');
});

// Mount API Routes
app.use(['/api/v1/auth/otp', '/api/auth/otp', '/api/v1/otp', '/api/otp'], otpRoutes);
app.use(['/api/v1/checkout/otp', '/api/checkout/otp'], otpRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/shops', shopRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/rider', riderRoutes);

// Universal Media Route: Serves from Disk, Syncs/Restores from MongoDB Atlas Cloud, and Fallbacks Gracefully
const FALLBACK_MEDIA_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300' fill='%23F1F5F9'><rect width='400' height='300'/><circle cx='130' cy='110' r='28' fill='%23CBD5E1'/><path d='M70 230l80-90 60 60 50-65 70 95z' fill='%23CBD5E1'/><text x='200' y='270' font-family='sans-serif' font-size='15' font-weight='700' fill='%2394A3B8' text-anchor='middle'>ANMOL STORE</text></svg>`;

app.get(['/uploads/:filename', '/api/v1/uploads/:filename', '/api/v1/media/:filename'], async (req, res, next) => {
  const { filename } = req.params;
  const diskPath = path.join(__dirname, '../uploads', filename);

  // 1. If present on disk, send from disk
  if (fs.existsSync(diskPath)) {
    return res.sendFile(diskPath);
  }

  // 2. Fetch from Cloud MongoDB Atlas Media Collection
  try {
    const media = await Media.findOne({ filename });
    if (media && media.data) {
      // Cache to disk for high-speed future reads
      try {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(diskPath, media.data);
      } catch (cacheErr) {}

      res.setHeader('Content-Type', media.contentType || 'image/jpeg');
      res.setHeader('Content-Length', media.data.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.end(media.data);
    }
  } catch (err) {
    console.warn(`[Media] Error querying MongoDB for ${filename}:`, err.message);
  }

  // 3. Fallback: Clean vector placeholder with 200 OK so phone and laptop NEVER show broken image icon
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache');
  return res.send(FALLBACK_MEDIA_SVG);
});

// Static Directories
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../../frontend'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Health check endpoint
app.get(['/api/health', '/api/v1/health'], (req, res) => {
  res.json({
    status: 'online',
    app: 'ANMOL STORE API',
    tagline: 'Aapki Dukaan, Aapka Business, Aapki Pehchaan',
    timestamp: new Date().toISOString()
  });
});

// Centralized Error Handling
app.use(errorHandler);

export default app;
