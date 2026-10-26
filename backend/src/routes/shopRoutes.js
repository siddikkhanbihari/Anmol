// ANMOL STORE - Shop Routes
import express from 'express';
import { getShops, getShopBySlug, getMyShop, updateShop } from '../controllers/shopController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getShops);
router.get('/mine', authenticateToken, requireRole('seller'), getMyShop);
router.get('/:slug', getShopBySlug);
router.patch('/:id', authenticateToken, updateShop);

export default router;
