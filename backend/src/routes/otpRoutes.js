// ANMOL STORE - OTP Routes
import express from 'express';
import {
  sendSignupOtp,
  verifySignupOtp,
  sendLoginOtp,
  verifyLoginOtp,
  sendCheckoutOtp,
  verifyCheckoutOtp
} from '../controllers/otpController.js';
import { authenticateToken } from '../middleware/auth.js';
import { otpSendLimiter, otpVerifyLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// 1. Signup Mobile OTP
router.post(['/signup/send', '/auth/otp/signup/send'], otpSendLimiter, sendSignupOtp);
router.post(['/signup/verify', '/auth/otp/signup/verify'], otpVerifyLimiter, verifySignupOtp);

// 2. Login Mobile OTP
router.post(['/login/send', '/auth/otp/login/send'], otpSendLimiter, sendLoginOtp);
router.post(['/login/verify', '/auth/otp/login/verify'], otpVerifyLimiter, verifyLoginOtp);

// 3. Checkout Mobile OTP (authenticated customer)
router.post(['/send', '/checkout/send', '/checkout/otp/send'], authenticateToken, otpSendLimiter, sendCheckoutOtp);
router.post(['/verify', '/checkout/verify', '/checkout/otp/verify'], authenticateToken, otpVerifyLimiter, verifyCheckoutOtp);

export default router;
