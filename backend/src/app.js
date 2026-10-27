// ANMOL STORE - Express Application Setup
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { upload } from './middleware/upload.js';
import { authenticateToken } from './middleware/auth.js';
import { ApiResponse } from './utils/apiResponse.js';

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

// File Upload Endpoint
app.post('/api/v1/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return ApiResponse.badRequest(res, 'No file uploaded');
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return ApiResponse.created(res, { url: fileUrl, filename: req.file.filename }, 'Image uploaded successfully');
});

// Mount API Routes
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
app.get('/api/health', (req, res) => {
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
