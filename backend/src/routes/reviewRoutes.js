// ANMOL STORE - Review Routes
import express from 'express';
import { createReview, getReviews } from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getReviews);
router.post('/', authenticateToken, createReview);

export default router;
