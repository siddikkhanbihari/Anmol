// ANMOL STORE - Cart Routes
import express from 'express';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart
} from '../controllers/cartController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getCart);
router.post('/items', addItem);
router.patch('/items/:id', updateItem);
router.delete('/items/:id', removeItem);
router.delete('/', clearCart);

export default router;
