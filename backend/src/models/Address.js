// ANMOL STORE - Address Model
import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipientName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, 'Must be a 10-digit Indian phone number']
    },
    alternatePhone: String,
    street: {
      type: String,
      required: true
    },
    landmark: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true,
      default: 'Gujarat'
    },
    pincode: {
      type: String,
      required: true,
      default: '385001',
      match: [/^\d{6}$/, 'Must be a 6-digit Indian PIN code']
    },
    location: {
      lat: Number,
      lng: Number
    },
    addressType: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home'
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

addressSchema.index({ user: 1, isDefault: 1 });

export const Address = mongoose.model('Address', addressSchema);
