// ANMOL STORE - Cryptographically Secure OTP Utilities
import crypto from 'crypto';

const OTP_SECRET = process.env.OTP_SECRET || 'anmol_store_otp_secure_secret_2026';

/**
 * Generates a cryptographically secure 6-digit random numeric OTP string.
 */
export function generateOtp(length = 6) {
  // Use crypto.randomInt to guarantee uniform cryptographic randomness
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length);
  return crypto.randomInt(min, max).toString();
}

/**
 * Normalizes and validates Indian 10-digit mobile phone numbers.
 * Handles inputs with '+91', '91', '0', spaces, hyphens, and parentheses.
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, normalized10: '', e164: '', masked: '' };
  }

  // Strip all non-digit characters
  const digits = rawPhone.replace(/\D/g, '');

  let normalized10 = '';
  if (digits.length === 10) {
    normalized10 = digits;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    normalized10 = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    normalized10 = digits.slice(2);
  } else if (digits.length > 10) {
    normalized10 = digits.slice(-10);
  }

  // Validate standard Indian mobile prefix: must start with 6, 7, 8, or 9
  const isValid = /^[6-9]\d{9}$/.test(normalized10);

  const e164 = isValid ? `+91${normalized10}` : '';
  const masked = isValid ? `+91 ******${normalized10.slice(-4)}` : '';

  return {
    isValid,
    normalized10,
    e164,
    masked
  };
}

/**
 * Generates a random cryptographic salt for OTP hashing.
 */
export function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hashes an OTP with a secret and unique per-challenge salt using HMAC-SHA256.
 */
export function hashOtp(otp, salt) {
  return crypto
    .createHmac('sha256', `${OTP_SECRET}:${salt}`)
    .update(otp.toString())
    .digest('hex');
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
export function verifyOtpHash(enteredOtp, salt, storedHash) {
  if (!enteredOtp || !salt || !storedHash) return false;

  try {
    const candidateHash = hashOtp(enteredOtp, salt);
    const candidateBuffer = Buffer.from(candidateHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (candidateBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Generates a unique, high-entropy challenge token for client session tracking.
 */
export function generateChallengeToken() {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Generates a single-use verification token after OTP has been successfully verified.
 */
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}
