// ANMOL STORE - Order Routes
import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderLiveTracking,
  getSellerOrders,
  updateSellerOrderStatus,
  cancelOrder
} from '../controllers/orderController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createOrder);
router.get('/mine', getMyOrders);
router.get('/seller', requireRole('seller', 'admin'), getSellerOrders);
router.get('/:id', getOrderById);
router.get('/:id/live-tracking', getOrderLiveTracking);
router.patch('/seller/:id/status', requireRole('seller', 'admin'), updateSellerOrderStatus);
router.patch('/:id/cancel', cancelOrder);

export default router;
