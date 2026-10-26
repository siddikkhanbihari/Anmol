// ANMOL STORE - ServiceBooking Model
import mongoose from 'mongoose';

const serviceBookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceListing',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true
    },
    bookingDate: {
      type: Date,
      required: true
    },
    timeSlot: {
      type: String,
      required: true,
      enum: [
        '09:00 AM - 11:00 AM',
        '11:00 AM - 01:00 PM',
        '02:00 PM - 04:00 PM',
        '04:00 PM - 06:00 PM',
        '06:00 PM - 08:00 PM'
      ]
    },
    serviceAddress: {
      street: { type: String, required: true },
      landmark: String,
      city: { type: String, required: true },
      pincode: { type: String, required: true }
    },
    customerPhone: {
      type: String,
      required: true
    },
    problemDescription: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    estimatedCost: {
      type: Number,
      required: true
    },
    finalCost: {
      type: Number
    },
    cancellationReason: String,
    providerNotes: String
  },
  {
    timestamps: true
  }
);

serviceBookingSchema.index({ customer: 1, bookingDate: -1 });
serviceBookingSchema.index({ provider: 1, status: 1 });

export const ServiceBooking = mongoose.model('ServiceBooking', serviceBookingSchema);
