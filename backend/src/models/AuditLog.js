// ANMOL STORE - AuditLog Model
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true
    },
    targetEntity: {
      type: String,
      required: true
    },
    entityId: {
      type: String
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    },
    ipAddress: String
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ admin: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
