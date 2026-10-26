// ANMOL STORE - SellerProfile Model
import mongoose from 'mongoose';

const sellerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    businessName: {
      type: String,
      required: [true, 'Business/Shop name is required'],
      trim: true
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true
    },
    businessCategory: {
      type: String,
      required: true,
      enum: [
        'Kirana & Grocery',
        'Electronics & Mobile',
        'Hardware & Machinery',
        'Auto Garage & Repair',
        'Services & Labour',
        'Vehicles & Auto',
        'General Store & Stationery',
        'Other'
      ]
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true
    },
    documentUrl: {
      type: String
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: {
      type: String
    },
    approvedAt: {
      type: Date
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      upiId: String
    }
  },
  {
    timestamps: true
  }
);

export const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema);
