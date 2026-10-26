// ANMOL STORE - Shop Model
import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema(
  {
    sellerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: 'Your trusted local neighbourhood shop.'
    },
    category: {
      type: String,
      required: true
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80'
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true, default: 'Kanpur' },
      state: { type: String, required: true, default: 'Uttar Pradesh' },
      pincode: { type: String, required: true, match: [/^\d{6}$/, 'Must be a 6-digit Indian PIN code'] },
      landmark: String
    },
    operatingAreas: [String],
    deliveryPincodes: [String],
    businessHours: {
      open: { type: String, default: '09:00 AM' },
      close: { type: String, default: '09:00 PM' },
      days: { type: String, default: 'Monday - Sunday' }
    },
    contactPhone: {
      type: String,
      required: true
    },
    contactEmail: {
      type: String
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
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    minimumOrderAmount: {
      type: Number,
      default: 0
    },
    deliveryCharge: {
      type: Number,
      default: 40
    }
  },
  {
    timestamps: true
  }
);

// Indexes
shopSchema.index({ 'address.city': 1, 'address.pincode': 1 });
shopSchema.index({ category: 1 });
shopSchema.index({ isActive: 1, isVerified: 1 });

export const Shop = mongoose.model('Shop', shopSchema);
