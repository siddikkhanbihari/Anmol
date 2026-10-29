// ANMOL STORE - Secure Mobile SMS OTP Controller
import { User, Shop, Notification, PlatformSettings } from '../models/index.js';
import { OtpChallenge } from '../models/OtpChallenge.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { JWT_CONFIG } from '../config/jwt.js';
import { smsService } from '../services/smsService.js';
import {
  generateOtp,
  normalizePhone,
  generateSalt,
  hashOtp,
  verifyOtpHash,
  generateChallengeToken,
  generateVerificationToken
} from '../utils/otpHelper.js';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_VERIFICATION_ATTEMPTS = 5;

// ==========================================
// 1. SIGNUP MOBILE OTP FLOW
// ==========================================

export async function sendSignupOtp(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return ApiResponse.badRequest(res, 'Please provide name, email, 10-digit mobile number, and password.');
    }

    if (password.length < 6) {
      return ApiResponse.badRequest(res, 'Password must be at least 6 characters long.');
    }

    const { isValid, normalized10, e164, masked } = normalizePhone(phone);
    if (!isValid) {
      return ApiResponse.badRequest(res, 'Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
    }

    // Check if account already exists with this email or phone
    const phoneVariants = [normalized10, e164, `91${normalized10}`, `0${normalized10}`];
    const existing = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { phone: { $in: phoneVariants } }
      ]
    });

    if (existing) {
      return ApiResponse.badRequest(res, 'An account with this mobile number or email already exists. Please log in.');
    }

    // Invalidate stale unverified signup challenges for this phone
    const existingChallenge = await OtpChallenge.findOne({
      normalizedPhone: normalized10,
      purpose: 'signup',
      isConsumed: false
    }).sort({ createdAt: -1 });

    if (existingChallenge) {
      const timeSinceLast = Date.now() - new Date(existingChallenge.lastSentAt).getTime();
      if (timeSinceLast < RESEND_COOLDOWN_MS) {
        const remainingSec = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLast) / 1000);
        return ApiResponse.badRequest(res, `Please wait ${remainingSec} seconds before requesting a new OTP.`);
      }
      // Supersede older challenge
      existingChallenge.isConsumed = true;
      await existingChallenge.save();
    }

    // Generate cryptographic OTP & Salt
    const otp = generateOtp(6);
    const salt = generateSalt();
    const otpHashed = hashOtp(otp, salt);
    const challengeToken = generateChallengeToken();

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // Store in dedicated OtpChallenge collection
    await OtpChallenge.create({
      phone,
      normalizedPhone: normalized10,
      purpose: 'signup',
      otpHash: otpHashed,
      otpSalt: salt,
      challengeToken,
      signupData: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: password
      },
      devOtpCode: process.env.NODE_ENV !== 'production' ? otp : null,
      expiresAt,
      lastSentAt: new Date(),
      clientIp: req.ip,
      userAgent: req.headers['user-agent'] || ''
    });

    // Send SMS via configured transactional provider
    await smsService.sendOtp(normalized10, otp, 'signup');

    return ApiResponse.success(res, {
      challengeToken,
      phoneMasked: masked,
      expiresIn: 300,
      cooldownSeconds: 30
    }, `OTP sent successfully to ${masked}. Valid for 5 minutes.`);
  } catch (err) {
    next(err);
  }
}

export async function verifySignupOtp(req, res, next) {
  try {
    const { challengeToken, otp } = req.body;

    if (!challengeToken || !otp) {
      return ApiResponse.badRequest(res, 'Challenge token and 6-digit OTP are required.');
    }

    const cleanOtp = otp.toString().trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return ApiResponse.badRequest(res, 'OTP must be exactly 6 digits.');
    }

    const challenge = await OtpChallenge.findOne({
      challengeToken,
      purpose: 'signup',
      isConsumed: false
    }).select('+otpHash +otpSalt');

    if (!challenge) {
      return ApiResponse.badRequest(res, 'Invalid or expired OTP session. Please request a new code.');
    }

    // Check expiration
    if (Date.now() > new Date(challenge.expiresAt).getTime()) {
      challenge.isConsumed = true;
      await challenge.save();
      return ApiResponse.badRequest(res, 'This OTP has expired. Please request a new code.');
    }

    // Check attempt lockout
    if (challenge.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      challenge.isConsumed = true;
      await challenge.save();
      return ApiResponse.badRequest(res, 'Maximum verification attempts exceeded. Please request a new OTP.');
    }

    // Constant-time hash verification
    const isValid = verifyOtpHash(cleanOtp, challenge.otpSalt, challenge.otpHash);
    if (!isValid) {
      challenge.attempts += 1;
      await challenge.save();
      const remaining = MAX_VERIFICATION_ATTEMPTS - challenge.attempts;
      return ApiResponse.badRequest(res, `Incorrect OTP. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`);
    }

    // Mark challenge verified & consumed (cannot be replayed)
    challenge.isVerified = true;
    challenge.isConsumed = true;
    challenge.verifiedAt = new Date();
    challenge.consumedAt = new Date();
    await challenge.save();

    // Prevent duplicate race condition
    let user = await User.findOne({
      $or: [
        { email: challenge.signupData.email },
        { phone: challenge.normalizedPhone }
      ]
    });

    if (!user) {
      user = await User.create({
        name: challenge.signupData.name,
        email: challenge.signupData.email,
        phone: challenge.normalizedPhone,
        passwordHash: challenge.signupData.passwordHash,
        role: 'customer',
        status: 'active',
        isPhoneVerified: true
      });

      // Welcome Notification
      await Notification.create({
        user: user._id,
        title: 'Welcome to ANMOL STORE!',
        message: 'Your mobile number is verified. Start exploring trusted local kirana and dukaan products in your neighbourhood.',
        type: 'system'
      });
    }

    // Generate JWT access & refresh tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.isPhoneVerified = true;
    await user.save();

    res.cookie(JWT_CONFIG.COOKIE_NAME, refreshToken, JWT_CONFIG.COOKIE_OPTIONS);

    return ApiResponse.created(res, {
      user: user.toSafeObject(),
      accessToken
    }, 'Mobile number verified and account created successfully!');
  } catch (err) {
    next(err);
  }
}

// ==========================================
// 2. LOGIN MOBILE OTP FLOW
// ==========================================

export async function sendLoginOtp(req, res, next) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return ApiResponse.badRequest(res, 'Please provide your registered mobile number.');
    }

    const { isValid, normalized10, e164, masked } = normalizePhone(phone);
    if (!isValid) {
      return ApiResponse.badRequest(res, 'Please enter a valid 10-digit Indian mobile number.');
    }

    const phoneVariants = [normalized10, e164, `91${normalized10}`, `0${normalized10}`];
    const user = await User.findOne({ phone: { $in: phoneVariants } });

    if (!user) {
      return ApiResponse.notFound(res, 'No registered account found with this mobile number. Please register or check the number.');
    }

    if (user.status === 'suspended') {
      return ApiResponse.forbidden(res, 'Your account has been suspended. Please contact ANMOL STORE support.');
    }

    // Cooldown check
    const existingChallenge = await OtpChallenge.findOne({
      normalizedPhone: normalized10,
      purpose: 'login',
      isConsumed: false
    }).sort({ createdAt: -1 });

    if (existingChallenge) {
      const timeSinceLast = Date.now() - new Date(existingChallenge.lastSentAt).getTime();
      if (timeSinceLast < RESEND_COOLDOWN_MS) {
        const remainingSec = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLast) / 1000);
        return ApiResponse.badRequest(res, `Please wait ${remainingSec} seconds before requesting a new login OTP.`);
      }
      existingChallenge.isConsumed = true;
      await existingChallenge.save();
    }

    // Generate cryptographic OTP
    const otp = generateOtp(6);
    const salt = generateSalt();
    const otpHashed = hashOtp(otp, salt);
    const challengeToken = generateChallengeToken();

    await OtpChallenge.create({
      phone,
      normalizedPhone: normalized10,
      purpose: 'login',
      otpHash: otpHashed,
      otpSalt: salt,
      challengeToken,
      userId: user._id,
      devOtpCode: process.env.NODE_ENV !== 'production' ? otp : null,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      lastSentAt: new Date(),
      clientIp: req.ip,
      userAgent: req.headers['user-agent'] || ''
    });

    await smsService.sendOtp(normalized10, otp, 'login');

    return ApiResponse.success(res, {
      challengeToken,
      phoneMasked: masked,
      expiresIn: 300,
      cooldownSeconds: 30
    }, `Login OTP sent to ${masked}. Valid for 5 minutes.`);
  } catch (err) {
    next(err);
  }
}

export async function verifyLoginOtp(req, res, next) {
  try {
    const { challengeToken, otp } = req.body;

    if (!challengeToken || !otp) {
      return ApiResponse.badRequest(res, 'Challenge token and 6-digit OTP are required.');
    }

    const cleanOtp = otp.toString().trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return ApiResponse.badRequest(res, 'OTP must be exactly 6 digits.');
    }

    const challenge = await OtpChallenge.findOne({
      challengeToken,
      purpose: 'login',
      isConsumed: false
    }).select('+otpHash +otpSalt');

    if (!challenge) {
      return ApiResponse.badRequest(res, 'Invalid or expired OTP session. Please request a new login code.');
    }

    if (Date.now() > new Date(challenge.expiresAt).getTime()) {
      challenge.isConsumed = true;
      await challenge.save();
      return ApiResponse.badRequest(res, 'This OTP has expired. Please request a new login code.');
    }

    if (challenge.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      challenge.isConsumed = true;
      await challenge.save();
      return ApiResponse.badRequest(res, 'Maximum verification attempts exceeded. Please request a new code.');
    }

    const isValid = verifyOtpHash(cleanOtp, challenge.otpSalt, challenge.otpHash);
    if (!isValid) {
      challenge.attempts += 1;
      await challenge.save();
      const remaining = MAX_VERIFICATION_ATTEMPTS - challenge.attempts;
      return ApiResponse.badRequest(res, `Incorrect OTP. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`);
    }

    challenge.isVerified = true;
    challenge.isConsumed = true;
    challenge.verifiedAt = new Date();
    challenge.consumedAt = new Date();
    await challenge.save();

    const user = await User.findById(challenge.userId);
    if (!user) {
      return ApiResponse.notFound(res, 'User account associated with this OTP was not found.');
    }

    if (user.status === 'suspended') {
      return ApiResponse.forbidden(res, 'Account is suspended. Please contact platform support.');
    }

    user.isPhoneVerified = true;
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie(JWT_CONFIG.COOKIE_NAME, refreshToken, JWT_CONFIG.COOKIE_OPTIONS);

    // If seller, load shop
    let shop = null;
    if (user.role === 'seller') {
      shop = await Shop.findOne({ user: user._id });
    }

    // If rider, load profile
    let riderProfile = null;
    try {
      const { RiderProfile } = await import('../models/index.js');
      riderProfile = await RiderProfile.findOne({ user: user._id });
    } catch (e) {}

    return ApiResponse.success(res, {
      user: user.toSafeObject(),
      shop,
      riderProfile,
      accessToken,
      refreshToken
    }, 'Signed in successfully via mobile OTP!');
  } catch (err) {
    next(err);
  }
}

// ==========================================
// 3. CHECKOUT MOBILE OTP FLOW
// ==========================================

export async function sendCheckoutOtp(req, res, next) {
  try {
    const user = req.user;
    const recipientPhone = (req.body.phone || user.phone || '').trim();

    const { isValid, normalized10, e164, masked } = normalizePhone(recipientPhone);
    if (!isValid) {
      return ApiResponse.badRequest(res, 'Valid 10-digit mobile number required for order verification.');
    }

    // Cooldown check
    const existingChallenge = await OtpChallenge.findOne({
      userId: user._id,
      purpose: 'checkout',
      isConsumed: false
    }).sort({ createdAt: -1 });

    if (existingChallenge) {
      const timeSinceLast = Date.now() - new Date(existingChallenge.lastSentAt).getTime();
      if (timeSinceLast < RESEND_COOLDOWN_MS) {
        const remainingSec = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLast) / 1000);
        return ApiResponse.badRequest(res, `Please wait ${remainingSec} seconds before requesting a new checkout OTP.`);
      }
      existingChallenge.isConsumed = true;
      await existingChallenge.save();
    }

    const otp = generateOtp(6);
    const salt = generateSalt();
    const otpHashed = hashOtp(otp, salt);
    const challengeToken = generateChallengeToken();

    await OtpChallenge.create({
      phone: recipientPhone,
      normalizedPhone: normalized10,
      purpose: 'checkout',
      otpHash: otpHashed,
      otpSalt: salt,
      challengeToken,
      userId: user._id,
      devOtpCode: process.env.NODE_ENV !== 'production' ? otp : null,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      lastSentAt: new Date(),
      clientIp: req.ip,
      userAgent: req.headers['user-agent'] || ''
    });

    await smsService.sendOtp(normalized10, otp, 'checkout');

    return ApiResponse.success(res, {
      challengeToken,
      phoneMasked: masked,
      expiresIn: 300,
      cooldownSeconds: 30
    }, `Checkout verification OTP sent to ${masked}. Valid for 5 minutes.`);
  } catch (err) {
    next(err);
  }
}

export async function verifyCheckoutOtp(req, res, next) {
  try {
    const { challengeToken, otp } = req.body;

    if (!challengeToken || !otp) {
      return ApiResponse.badRequest(res, 'Challenge token and 6-digit OTP are required.');
    }

    const cleanOtp = otp.toString().trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return ApiResponse.badRequest(res, 'OTP must be exactly 6 digits.');
    }

    const challenge = await OtpChallenge.findOne({
      challengeToken,
      purpose: 'checkout',
      userId: req.user._id,
      isConsumed: false
    }).select('+otpHash +otpSalt');

    if (!challenge) {
      return ApiResponse.badRequest(res, 'Invalid or expired checkout OTP challenge.');
    }

    if (Date.now() > new Date(challenge.expiresAt).getTime()) {
      challenge.isConsumed = true;
      await challenge.save();
      return ApiResponse.badRequest(res, 'Checkout OTP has expired. Please request a new code.');
    }

    if (challenge.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      challenge.isConsumed = true;
      await challenge.save();
      return ApiResponse.badRequest(res, 'Maximum verification attempts exceeded. Please request a new OTP.');
    }

    const isValid = verifyOtpHash(cleanOtp, challenge.otpSalt, challenge.otpHash);
    if (!isValid) {
      challenge.attempts += 1;
      await challenge.save();
      const remaining = MAX_VERIFICATION_ATTEMPTS - challenge.attempts;
      return ApiResponse.badRequest(res, `Incorrect OTP. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`);
    }

    // Generate single-use verification token valid for 15 minutes
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    challenge.isVerified = true;
    challenge.verifiedAt = new Date();
    challenge.verificationToken = verificationToken;
    challenge.verificationTokenExpiresAt = tokenExpiry;
    await challenge.save();

    return ApiResponse.success(res, {
      checkoutVerificationToken: verificationToken,
      expiresAt: tokenExpiry
    }, 'Checkout phone successfully verified! You can now place your order.');
  } catch (err) {
    next(err);
  }
}
