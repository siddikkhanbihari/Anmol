// ANMOL STORE - Product Routes
import express from 'express';
import {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/seller/mine', authenticateToken, requireRole('seller', 'admin'), getMyProducts);
router.get('/:id', getProductById);
router.post('/', authenticateToken, requireRole('seller', 'admin'), createProduct);
router.patch('/:id', authenticateToken, requireRole('seller', 'admin'), updateProduct);
router.delete('/:id', authenticateToken, requireRole('seller', 'admin'), deleteProduct);

export default router;
