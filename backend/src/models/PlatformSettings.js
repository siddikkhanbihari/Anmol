// ANMOL STORE - PlatformSettings Model
import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'main_settings'
    },
    platformName: {
      type: String,
      default: 'ANMOL STORE'
    },
    primaryTagline: {
      type: String,
      default: 'Aapki Dukaan, Aapka Business, Aapki Pehchaan'
    },
    secondaryTagline: {
      type: String,
      default: 'LOCAL BUSINESS, DIGITAL FUTURE'
    },
    freeSellerRegistration: {
      type: Boolean,
      default: true
    },
    autoApproveSellers: {
      type: Boolean,
      default: false
    },
    defaultDeliveryCharge: {
      type: Number,
      default: 40
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 499
    },
    commissionRatePercent: {
      type: Number,
      default: 0
    },
    codEnabled: {
      type: Boolean,
      default: true
    },
    onlinePaymentEnabled: {
      type: Boolean,
      default: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    supportEmail: {
      type: String,
      default: 'support@anmolstore.in'
    },
    supportPhone: {
      type: String,
      default: '+91 80099 00123'
    }
  },
  {
    timestamps: true
  }
);

export const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
