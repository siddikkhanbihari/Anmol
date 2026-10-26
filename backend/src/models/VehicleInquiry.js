// ANMOL STORE - VehicleInquiry Model
import mongoose from 'mongoose';

const vehicleInquirySchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VehicleListing',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    customerName: {
      type: String,
      required: true
    },
    customerPhone: {
      type: String,
      required: true
    },
    customerEmail: {
      type: String
    },
    offeredPrice: {
      type: Number
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'negotiating', 'closed'],
      default: 'new'
    },
    sellerResponse: String
  },
  {
    timestamps: true
  }
);

vehicleInquirySchema.index({ customer: 1 });
vehicleInquirySchema.index({ seller: 1, status: 1 });

export const VehicleInquiry = mongoose.model('VehicleInquiry', vehicleInquirySchema);
