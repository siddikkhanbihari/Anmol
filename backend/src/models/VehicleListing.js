// ANMOL STORE - VehicleListing Model
import mongoose from 'mongoose';

const vehicleListingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop'
    },
    title: {
      type: String,
      required: [true, 'Vehicle title is required'],
      trim: true
    },
    vehicleType: {
      type: String,
      enum: ['car', 'bike', 'scooter', 'commercial'],
      required: true
    },
    make: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    variant: String,
    year: {
      type: Number,
      required: true,
      min: 1990,
      max: 2030
    },
    condition: {
      type: String,
      enum: ['new', 'used', 'certified_pre_owned'],
      default: 'used'
    },
    mileageKm: {
      type: Number,
      default: 0
    },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'],
      default: 'Petrol'
    },
    transmission: {
      type: String,
      enum: ['Manual', 'Automatic'],
      default: 'Manual'
    },
    askingPrice: {
      type: Number,
      required: [true, 'Asking price is required'],
      min: 0
    },
    photos: {
      type: [String],
      default: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80']
    },
    location: {
      city: { type: String, required: true },
      area: String,
      state: { type: String, default: 'Uttar Pradesh' },
      pincode: String
    },
    ownership: {
      type: String,
      enum: ['1st Owner', '2nd Owner', '3rd Owner', '4th+ Owner'],
      default: '1st Owner'
    },
    description: {
      type: String,
      required: true
    },
    isApproved: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

vehicleListingSchema.index({ vehicleType: 1, make: 1, askingPrice: 1 });
vehicleListingSchema.index({ 'location.city': 1 });

export const VehicleListing = mongoose.model('VehicleListing', vehicleListingSchema);
