// ANMOL STORE - ServiceListing Model
import mongoose from 'mongoose';

const serviceListingSchema = new mongoose.Schema(
  {
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    serviceType: {
      type: String,
      required: true,
      enum: [
        'Electrician',
        'Plumber',
        'AC & Appliance Repair',
        'Garage & Vehicle Repair',
        'Machinery & Equipment Repair',
        'Spare Parts Installation',
        'Labour & Loading Service',
        'Carpenter & Painter',
        'Other Service'
      ]
    },
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    pricingModel: {
      type: String,
      enum: ['fixed', 'starting_at', 'quotation_required'],
      default: 'starting_at'
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    serviceArea: {
      type: String,
      required: true,
      default: 'Within 15 km of shop'
    },
    durationMinutes: {
      type: Number,
      default: 60
    },
    images: {
      type: [String],
      default: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80']
    },
    isApproved: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

serviceListingSchema.index({ provider: 1, serviceType: 1 });
serviceListingSchema.index({ category: 1, isApproved: 1, isActive: 1 });

export const ServiceListing = mongoose.model('ServiceListing', serviceListingSchema);
