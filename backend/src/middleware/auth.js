// ANMOL STORE - Authentication & Role Authorization Middleware
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';

export async function authenticateToken(req, res, next) {
  try {
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.anmol_access_token) {
      token = req.cookies.anmol_access_token;
    }

    if (!token) {
      return ApiResponse.unauthorized(res, 'Authentication required. Please log in.');
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return ApiResponse.unauthorized(res, 'User session invalid. User not found.');
    }

    if (user.status === 'suspended') {
      return ApiResponse.forbidden(res, 'Your account has been suspended. Please contact support.');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Session token has expired. Please refresh token or log in.');
    }
    return ApiResponse.unauthorized(res, 'Invalid authentication token.');
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Your role is: ${req.user.role}`
      );
    }

    next();
  };
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch (e) {
    req.user = null;
  }
  next();
}
