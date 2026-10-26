// ANMOL STORE - Service & Booking Routes
import express from 'express';
import {
  getServices,
  getServiceById,
  createService,
  createServiceBooking,
  getMyServiceBookings,
  getProviderBookings,
  updateBookingStatus
} from '../controllers/serviceController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getServices);
router.get('/:id', getServiceById);

router.post('/', authenticateToken, requireRole('seller', 'admin'), createService);
router.post('/bookings', authenticateToken, createServiceBooking);
router.get('/bookings/mine', authenticateToken, getMyServiceBookings);
router.get('/bookings/provider', authenticateToken, requireRole('seller', 'admin'), getProviderBookings);
router.patch('/bookings/:id/status', authenticateToken, requireRole('seller', 'admin'), updateBookingStatus);

export default router;
