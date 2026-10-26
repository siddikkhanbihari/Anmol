// ANMOL STORE - Vehicle & Inquiry Routes
import express from 'express';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  createVehicleInquiry,
  getMyVehicleInquiries,
  getSellerVehicleInquiries
} from '../controllers/vehicleController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getVehicles);
router.get('/:id', getVehicleById);

router.post('/', authenticateToken, requireRole('seller', 'admin'), createVehicle);
router.post('/inquiries', authenticateToken, createVehicleInquiry);
router.get('/inquiries/mine', authenticateToken, getMyVehicleInquiries);
router.get('/inquiries/seller', authenticateToken, requireRole('seller', 'admin'), getSellerVehicleInquiries);

export default router;
