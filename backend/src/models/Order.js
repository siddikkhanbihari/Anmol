// ANMOL STORE - Order Model
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: String,
  variant: Object,
  totalItemPrice: { type: Number, required: true }
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  comment: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const sellerOrderGroupSchema = new mongoose.Schema({
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
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 40 },
  groupTotal: { type: Number, required: true },
  sellerStatus: {
    type: String,
    enum: [
      'pending',
      'accepted',
      'processing',
      'ready_for_pickup',
      'out_for_delivery',
      'shipped',
      'delivered',
      'cancelled',
      'rejected'
    ],
    default: 'pending'
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  riderProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RiderProfile'
  },
  riderAssignedAt: Date,
  riderPickedUpAt: Date,
  deliveryOtp: {
    type: String,
    default: () => Math.floor(1000 + Math.random() * 9000).toString()
  },
  riderPayout: {
    type: Number,
    default: 40
  },
  rejectionReason: String,
  trackingNumber: String,
  estimatedDeliveryDate: Date,
  deliveredAt: Date,
  statusHistory: [statusHistorySchema]
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sellerOrders: [sellerOrderGroupSchema],
    deliveryAddress: {
      recipientName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      landmark: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      location: {
        lat: Number,
        lng: Number
      }
    },
    subtotal: {
      type: Number,
      required: true
    },
    totalDeliveryFee: {
      type: Number,
      required: true
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    couponCode: String,
    totalAmount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'razorpay', 'online'],
      default: 'cod'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    overallStatus: {
      type: String,
      enum: ['placed', 'processing', 'partially_shipped', 'shipped', 'delivered', 'cancelled'],
      default: 'placed'
    },
    notes: String
  },
  {
    timestamps: true
  }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ 'sellerOrders.seller': 1 });
orderSchema.index({ 'sellerOrders.shop': 1 });

export const Order = mongoose.model('Order', orderSchema);
