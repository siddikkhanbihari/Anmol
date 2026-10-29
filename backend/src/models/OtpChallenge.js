// ANMOL STORE - OtpChallenge Model
import mongoose from 'mongoose';

const otpChallengeSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true
    },
    normalizedPhone: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    purpose: {
      type: String,
      enum: ['signup', 'login', 'checkout', 'profile_update'],
      required: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true,
      select: false
    },
    otpSalt: {
      type: String,
      required: true,
      select: false
    },
    challengeToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    devOtpCode: {
      type: String,
      default: null,
      select: false
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    signupData: {
      name: String,
      email: String,
      passwordHash: String,
      avatar: String
    },
    verificationToken: {
      type: String,
      default: null,
      index: true
    },
    verificationTokenExpiresAt: {
      type: Date,
      default: null
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    resendCount: {
      type: Number,
      default: 0
    },
    lastSentAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    isConsumed: {
      type: Boolean,
      default: false
    },
    consumedAt: {
      type: Date,
      default: null
    },
    clientIp: String,
    userAgent: String
  },
  {
    timestamps: true
  }
);

// TTL Index: Automatically remove expired challenges after 10 minutes past expiry
otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });
otpChallengeSchema.index({ normalizedPhone: 1, purpose: 1, isConsumed: 1 });

export const OtpChallenge = mongoose.model('OtpChallenge', otpChallengeSchema);
