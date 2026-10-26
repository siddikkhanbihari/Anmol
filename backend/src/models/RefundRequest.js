// ANMOL STORE - RefundRequest Model
import mongoose from 'mongoose';

const refundRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop'
    },
    reason: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'processed'],
      default: 'requested'
    },
    adminNotes: String,
    processedAt: Date
  },
  {
    timestamps: true
  }
);

export const RefundRequest = mongoose.model('RefundRequest', refundRequestSchema);
