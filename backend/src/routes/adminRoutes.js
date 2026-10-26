// ANMOL STORE - Admin Routes
import express from 'express';
import {
  getOverview,
  getSellers,
  updateSellerStatus,
  getUsers,
  updateUserStatus,
  getAllOrders,
  getPlatformSettings,
  updatePlatformSettings,
  getAuditLogs
} from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/overview', getOverview);
router.get('/sellers', getSellers);
router.patch('/sellers/:id/status', updateSellerStatus);
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/orders', getAllOrders);
router.get('/settings', getPlatformSettings);
router.patch('/settings', updatePlatformSettings);
router.get('/audit-logs', getAuditLogs);

export default router;
