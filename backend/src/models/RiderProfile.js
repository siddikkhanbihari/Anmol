// ANMOL STORE - Delivery Rider Profile Model
import mongoose from 'mongoose';

const riderProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'ev_scooter', 'cycle'],
      default: 'bike'
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    drivingLicenseNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: 'Palanpur'
    },
    serviceAreas: [
      {
        type: String,
        trim: true
      }
    ],
    isOnline: {
      type: Boolean,
      default: true
    },
    isApproved: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      default: 4.9,
      min: 1,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 1
    },
    todayEarnings: {
      type: Number,
      default: 0
    },
    todayDeliveries: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    totalDeliveries: {
      type: Number,
      default: 0
    },
    activeDelivery: {
      order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      },
      sellerOrderIndex: {
        type: Number,
        default: 0
      },
      assignedAt: Date
    },
    currentLocation: {
      lat: { type: Number, default: 24.1724 },
      lng: { type: Number, default: 72.4346 },
      address: { type: String, default: 'Aroma Circle, Palanpur, Gujarat' },
      updatedAt: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true
  }
);

riderProfileSchema.index({ isOnline: 1, isApproved: 1, city: 1 });

export const RiderProfile = mongoose.model('RiderProfile', riderProfileSchema);
export default RiderProfile;
