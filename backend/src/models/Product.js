// ANMOL STORE - Product Model
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Product description is required']
    },
    images: {
      type: [String],
      default: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price must be positive']
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 10
    },
    sku: {
      type: String,
      trim: true
    },
    unit: {
      type: String,
      default: 'piece',
      enum: ['piece', 'kg', 'gm', 'litre', 'ml', 'packet', 'box', 'set']
    },
    variants: [
      {
        name: String, // e.g., "Size" or "Weight"
        options: [String], // e.g., ["500g", "1kg"]
        priceDelta: { type: Number, default: 0 }
      }
    ],
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
      default: 4.5,
      min: 1,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    tags: [String]
  },
  {
    timestamps: true
  }
);

// Compound index for uniqueness of slug within a shop or globally
productSchema.index({ shop: 1, slug: 1 }, { unique: true });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1, rating: -1 });
productSchema.index({ isActive: 1, isApproved: 1 });

export const Product = mongoose.model('Product', productSchema);
