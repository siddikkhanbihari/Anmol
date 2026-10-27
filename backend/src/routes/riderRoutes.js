// ANMOL STORE - Delivery Rider API Routes
import express from 'express';
import { riderController } from '../controllers/riderController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public: Onboard new delivery partner
router.post('/register', riderController.registerRider);

// Protected: Rider fleet endpoints (Requires login with rider role or admin)
router.use(authenticateToken);
router.use(requireRole('rider', 'admin'));

router.get('/profile', riderController.getProfile);
router.put('/status', riderController.toggleStatus);
router.put('/location', riderController.updateLocation);
router.get('/available', riderController.getAvailableDeliveries);
router.post('/orders/:orderId/accept', riderController.acceptDelivery);
router.post('/orders/:orderId/pickup', riderController.pickupDelivery);
router.post('/orders/:orderId/deliver', riderController.completeDelivery);
router.get('/history', riderController.getHistory);

export default router;
