// ANMOL STORE - User & Address Routes
import express from 'express';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  submitSupportTicket
} from '../controllers/userController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/addresses', authenticateToken, getAddresses);
router.post('/addresses', authenticateToken, addAddress);
router.patch('/addresses/:id', authenticateToken, updateAddress);
router.delete('/addresses/:id', authenticateToken, deleteAddress);

router.get('/notifications', authenticateToken, getNotifications);
router.patch('/notifications/:id/read', authenticateToken, markNotificationRead);
router.patch('/notifications/read-all', authenticateToken, markAllNotificationsRead);

router.post('/support', optionalAuth, submitSupportTicket);

export default router;
