// ANMOL STORE - JWT Configuration
import dotenv from 'dotenv';
dotenv.config();

export const JWT_CONFIG = {
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'anmol_super_secret_access_key_2026_jwt_token',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'anmol_super_secret_refresh_key_2026_jwt_token',
  ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  COOKIE_NAME: 'anmol_refresh_token',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};
