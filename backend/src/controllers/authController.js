// ANMOL STORE - Authentication Controller
import crypto from 'crypto';
import { User, SellerProfile, Shop, Notification, AuditLog } from '../models/index.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { JWT_CONFIG } from '../config/jwt.js';

export async function register(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return ApiResponse.badRequest(res, 'Please provide name, email, phone, and password.');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return ApiResponse.badRequest(res, 'An account with this email already exists.');
    }

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: password,
      role: 'customer'
    });

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token cookie
    res.cookie(JWT_CONFIG.COOKIE_NAME, refreshToken, JWT_CONFIG.COOKIE_OPTIONS);

    // Create welcome notification
    await Notification.create({
      user: user._id,
      title: 'Welcome to ANMOL STORE!',
      message: 'Your account has been created. Discover genuine products and trusted services from your local neighbourhood shops.',
      type: 'system'
    });

    return ApiResponse.created(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      },
      accessToken
    }, 'Customer account registered successfully');
  } catch (err) {
    next(err);
  }
}

export async function registerSeller(req, res, next) {
  try {
    const {
      name,
      email,
      phone,
      password,
      businessName,
      ownerName,
      businessCategory,
      panNumber,
      gstin,
      street,
      city,
      state,
      pincode,
      operatingAreas,
      description
    } = req.body;

    if (!name || !email || !phone || !password || !businessName || !businessCategory || !street || !pincode) {
      return ApiResponse.badRequest(res, 'Please provide all required personal and shop details.');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return ApiResponse.badRequest(res, 'An account with this email already exists.');
    }

    // Create user with seller role
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: password,
      role: 'seller'
    });

    // Create Seller Profile
    const sellerProfile = await SellerProfile.create({
      user: user._id,
      businessName,
      ownerName: ownerName || name,
      businessCategory,
      panNumber,
      gstin,
      approvalStatus: 'approved' // Set to approved for seamless local demo, or configurable via platform settings
    });

    // Generate unique slug for shop
    const slugBase = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = slugBase;
    let count = 1;
    while (await Shop.findOne({ slug })) {
      slug = `${slugBase}-${count++}`;
    }

    // Create Shop
    const shop = await Shop.create({
      sellerProfile: sellerProfile._id,
      user: user._id,
      name: businessName,
      slug,
      description: description || `Welcome to ${businessName}. Serving local quality products and services.`,
      category: businessCategory,
      address: {
        street,
        city: city || 'Kanpur',
        state: state || 'Uttar Pradesh',
        pincode
      },
      operatingAreas: operatingAreas ? (Array.isArray(operatingAreas) ? operatingAreas : [operatingAreas]) : [city || 'Local Area'],
      deliveryPincodes: [pincode],
      contactPhone: phone,
      contactEmail: email,
      isVerified: true,
      isActive: true
    });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie(JWT_CONFIG.COOKIE_NAME, refreshToken, JWT_CONFIG.COOKIE_OPTIONS);

    // Welcome notification
    await Notification.create({
      user: user._id,
      title: 'Dukaan Ban Gayi! Welcome to ANMOL STORE',
      message: `Your shop "${businessName}" is registered. You can now add products and manage your local customer orders.`,
      type: 'approval'
    });

    return ApiResponse.created(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      },
      shop: {
        id: shop._id,
        name: shop.name,
        slug: shop.slug,
        category: shop.category
      },
      accessToken
    }, 'Seller and digital storefront registered successfully!');
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const rawIdentifier = (req.body.identifier || req.body.email || req.body.phone || req.body.emailOrPhone || '').trim();
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      return ApiResponse.badRequest(res, 'Please provide both mobile number or email and password.');
    }

    // Format phone variants for matching
    const cleanPhone = rawIdentifier.replace(/[^0-9]/g, '');
    const phoneVariants = [rawIdentifier];
    if (cleanPhone.length >= 10) {
      const last10 = cleanPhone.slice(-10);
      phoneVariants.push(last10, `+91${last10}`, `91${last10}`, `0${last10}`);
    }

    const query = {
      $or: [
        { email: rawIdentifier.toLowerCase() },
        { phone: { $in: phoneVariants } }
      ]
    };

    const user = await User.findOne(query).select('+passwordHash');
    if (!user) {
      return ApiResponse.unauthorized(res, 'Invalid mobile number, email, or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return ApiResponse.unauthorized(res, 'Invalid mobile number, email, or password.');
    }

    if (user.status === 'suspended') {
      return ApiResponse.forbidden(res, 'Your account is suspended. Please contact platform support.');
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie(JWT_CONFIG.COOKIE_NAME, refreshToken, JWT_CONFIG.COOKIE_OPTIONS);

    // If seller, get shop details
    let shop = null;
    if (user.role === 'seller') {
      shop = await Shop.findOne({ user: user._id });
    }

    // Check Rider profile if any
    let riderProfile = null;
    try {
      const { RiderProfile } = await import('../models/index.js');
      riderProfile = await RiderProfile.findOne({ user: user._id });
    } catch (e) {
      // Ignore if not applicable
    }

    return ApiResponse.success(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        hasShop: !!shop,
        hasRiderProfile: !!riderProfile
      },
      shop,
      riderProfile,
      accessToken,
      refreshToken
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const incomingToken = req.cookies[JWT_CONFIG.COOKIE_NAME] || req.body.refreshToken;
    if (!incomingToken) {
      return ApiResponse.unauthorized(res, 'Refresh token not provided.');
    }

    const user = await User.findOne({ refreshToken: incomingToken });
    if (!user) {
      return ApiResponse.unauthorized(res, 'Invalid or revoked refresh token.');
    }

    // Verify token
    const jwt = (await import('jsonwebtoken')).default;
    jwt.verify(incomingToken, JWT_CONFIG.REFRESH_SECRET);

    // Generate new access token
    const accessToken = user.generateAccessToken();

    return ApiResponse.success(res, { accessToken }, 'Access token refreshed');
  } catch (err) {
    return ApiResponse.unauthorized(res, 'Invalid or expired refresh token.');
  }
}

export async function logout(req, res, next) {
  try {
    const incomingToken = req.cookies[JWT_CONFIG.COOKIE_NAME];
    if (incomingToken) {
      await User.findOneAndUpdate({ refreshToken: incomingToken }, { refreshToken: null });
    }
    res.clearCookie(JWT_CONFIG.COOKIE_NAME, JWT_CONFIG.COOKIE_OPTIONS);
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    let shop = null;
    let sellerProfile = null;

    if (user.role === 'seller') {
      shop = await Shop.findOne({ user: user._id });
      sellerProfile = await SellerProfile.findOne({ user: user._id });
    }

    return ApiResponse.success(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt
      },
      shop,
      sellerProfile
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();

    return ApiResponse.success(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar
    }, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const rawIdentifier = (req.body.identifier || req.body.email || req.body.phone || '').trim();
    if (!rawIdentifier) {
      return ApiResponse.badRequest(res, 'Please provide your registered mobile number or email.');
    }

    const cleanPhone = rawIdentifier.replace(/[^0-9]/g, '');
    const phoneVariants = [rawIdentifier];
    if (cleanPhone.length >= 10) {
      const last10 = cleanPhone.slice(-10);
      phoneVariants.push(last10, `+91${last10}`, `91${last10}`, `0${last10}`);
    }

    const user = await User.findOne({
      $or: [
        { email: rawIdentifier.toLowerCase() },
        { phone: { $in: phoneVariants } }
      ]
    });

    if (!user) {
      // Return success anyway for security timing protection
      return ApiResponse.success(res, null, 'If this mobile or email is registered, password reset instructions have been generated.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    return ApiResponse.success(res, { resetToken }, 'Password reset instructions generated (use token in development mode).');
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return ApiResponse.badRequest(res, 'Token and new password are required.');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return ApiResponse.badRequest(res, 'Invalid or expired password reset token.');
    }

    user.passwordHash = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return ApiResponse.success(res, null, 'Password has been reset successfully. Please log in with your new password.');
  } catch (err) {
    next(err);
  }
}
