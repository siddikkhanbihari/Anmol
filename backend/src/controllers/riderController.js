// ANMOL STORE - Delivery Rider Controller
import { User, RiderProfile, Order, Shop, Notification } from '../models/index.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const riderController = {
  /**
   * Register as a new Delivery Partner (Rider)
   */
  async registerRider(req, res, next) {
    try {
      const {
        name,
        email,
        phone,
        password,
        vehicleType,
        vehicleNumber,
        drivingLicenseNumber,
        city
      } = req.body;

      if (!name || !email || !phone || !password) {
        return ApiResponse.badRequest(res, 'Name, email, phone, and password are required.');
      }

      // Check existing user
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return ApiResponse.conflict(res, 'An account with this email already exists.');
      }

      // Create User with rider role
      const user = new User({
        name,
        email: email.toLowerCase(),
        phone,
        role: 'rider',
        status: 'active'
      });
      await user.setPassword(password);
      await user.save();

      // Create Rider Profile
      const riderProfile = await RiderProfile.create({
        user: user._id,
        vehicleType: vehicleType || 'bike',
        vehicleNumber: vehicleNumber || '',
        drivingLicenseNumber: drivingLicenseNumber || '',
        city: city || 'Kanpur',
        isOnline: true,
        isApproved: true
      });

      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      return ApiResponse.created(
        res,
        {
          user: user.toSafeObject(),
          riderProfile,
          accessToken,
          refreshToken
        },
        'Delivery partner registered successfully! Welcome to ANMOL STORE Fleet.'
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Current Rider Profile & Active Status
   */
  async getProfile(req, res, next) {
    try {
      let rider = await RiderProfile.findOne({ user: req.user._id })
        .populate('user', 'name email phone avatar')
        .populate({
          path: 'activeDelivery.order',
          populate: [
            { path: 'customer', select: 'name phone' },
            { path: 'sellerOrders.shop', select: 'name address phone logo coverImage location' }
          ]
        });

      if (!rider) {
        // If user has rider role but profile was not created, auto-create
        rider = await RiderProfile.create({
          user: req.user._id,
          city: 'Kanpur',
          isOnline: true,
          isApproved: true
        });
        await rider.populate('user', 'name email phone avatar');
      }

      return ApiResponse.success(res, rider, 'Rider profile retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Toggle Online / Offline Duty Status
   */
  async toggleStatus(req, res, next) {
    try {
      const rider = await RiderProfile.findOne({ user: req.user._id });
      if (!rider) {
        return ApiResponse.notFound(res, 'Rider profile not found');
      }

      rider.isOnline = !rider.isOnline;
      await rider.save();

      return ApiResponse.success(
        res,
        { isOnline: rider.isOnline },
        rider.isOnline ? 'You are now ONLINE and ready to receive delivery tasks!' : 'You are now OFFLINE.'
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update Rider GPS Location
   */
  async updateLocation(req, res, next) {
    try {
      const { lat, lng, address } = req.body;
      const rider = await RiderProfile.findOne({ user: req.user._id });
      if (!rider) {
        return ApiResponse.notFound(res, 'Rider profile not found');
      }

      if (lat && lng) {
        rider.currentLocation = {
          lat: Number(lat),
          lng: Number(lng),
          address: address || rider.currentLocation?.address || '',
          updatedAt: new Date()
        };
        await rider.save();
      }

      return ApiResponse.success(res, rider.currentLocation, 'Location updated');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Orders Available for Pickup
   */
  async getAvailableDeliveries(req, res, next) {
    try {
      const rider = await RiderProfile.findOne({ user: req.user._id });
      if (!rider || !rider.isOnline) {
        return ApiResponse.success(res, [], 'You must be online to view available deliveries');
      }

      // Find orders that have sellerOrders with NO rider assigned and not cancelled/delivered
      const orders = await Order.find({
        overallStatus: { $nin: ['cancelled', 'delivered'] },
        'sellerOrders.sellerStatus': { $in: ['pending', 'accepted', 'processing', 'ready_for_pickup'] },
        'sellerOrders.rider': null
      })
        .populate('customer', 'name phone')
        .populate('sellerOrders.shop', 'name address phone logo location')
        .sort({ createdAt: -1 })
        .limit(25);

      // Flatten to individual deliverable shop-order tasks
      const tasks = [];
      for (const order of orders) {
        order.sellerOrders.forEach((so, index) => {
          if (
            ['pending', 'accepted', 'processing', 'ready_for_pickup'].includes(so.sellerStatus) &&
            !so.rider
          ) {
            tasks.push({
              orderId: order._id,
              orderNumber: order.orderNumber,
              sellerOrderIndex: index,
              shop: so.shop,
              itemsCount: (so.items || []).reduce((sum, it) => sum + it.quantity, 0),
              subtotal: so.subtotal,
              payout: so.riderPayout || 40,
              customerAddress: order.deliveryAddress,
              sellerStatus: so.sellerStatus,
              createdAt: order.createdAt
            });
          }
        });
      }

      return ApiResponse.success(res, tasks, 'Available delivery tasks fetched');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Rider Accepts a Delivery Task
   */
  async acceptDelivery(req, res, next) {
    try {
      const { orderId } = req.params;
      const { sellerOrderIndex = 0 } = req.body;

      const rider = await RiderProfile.findOne({ user: req.user._id });
      if (!rider) {
        return ApiResponse.notFound(res, 'Rider profile not found');
      }

      if (rider.activeDelivery?.order) {
        return ApiResponse.badRequest(res, 'You already have an ongoing active delivery. Complete it first!');
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return ApiResponse.notFound(res, 'Order not found');
      }

      const idx = Number(sellerOrderIndex);
      const sellerOrder = order.sellerOrders[idx];
      if (!sellerOrder) {
        return ApiResponse.badRequest(res, 'Invalid seller order index');
      }

      if (sellerOrder.rider) {
        return ApiResponse.badRequest(res, 'This delivery task has already been accepted by another partner.');
      }

      // Assign to this rider
      sellerOrder.rider = req.user._id;
      sellerOrder.riderProfile = rider._id;
      sellerOrder.riderAssignedAt = new Date();
      sellerOrder.sellerStatus = 'ready_for_pickup';
      sellerOrder.statusHistory.push({
        status: 'ready_for_pickup',
        comment: `Assigned to delivery partner ${req.user.name}`,
        updatedBy: req.user._id
      });

      // Update active delivery in rider profile
      rider.activeDelivery = {
        order: order._id,
        sellerOrderIndex: idx,
        assignedAt: new Date()
      };

      await order.save();
      await rider.save();

      // Notify customer
      try {
        await Notification.create({
          user: order.customer,
          title: 'Delivery Partner Assigned 🛵',
          message: `${req.user.name} is on the way to pick up your order #${order.orderNumber}.`,
          type: 'order',
          link: `/customer-dashboard.html?tab=orders&id=${order._id}`
        });
      } catch (notifErr) {
        console.warn('Could not send notification:', notifErr.message);
      }

      // Notify seller
      try {
        await Notification.create({
          user: sellerOrder.seller,
          title: 'Rider Assigned for Pickup! 🛵',
          message: `${req.user.name} has accepted pickup for order #${order.orderNumber}. Please keep items ready.`,
          type: 'order',
          link: `/seller-orders.html?id=${order._id}`
        });
      } catch (sellerNotifErr) {
        console.warn('Could not send seller notification:', sellerNotifErr.message);
      }

      return ApiResponse.success(res, { orderId: order._id, sellerOrderIndex: idx }, 'Delivery task accepted successfully!');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Mark Order Picked Up from Shop (Out for Delivery)
   */
  async pickupDelivery(req, res, next) {
    try {
      const { orderId } = req.params;
      const rider = await RiderProfile.findOne({ user: req.user._id });

      const order = await Order.findById(orderId).populate('customer', 'name phone');
      if (!order) {
        return ApiResponse.notFound(res, 'Order not found');
      }

      const idx = rider?.activeDelivery?.sellerOrderIndex || 0;
      const sellerOrder = order.sellerOrders[idx];

      if (!sellerOrder || String(sellerOrder.rider) !== String(req.user._id)) {
        return ApiResponse.forbidden(res, 'You are not the assigned rider for this order');
      }

      sellerOrder.sellerStatus = 'out_for_delivery';
      sellerOrder.riderPickedUpAt = new Date();
      sellerOrder.statusHistory.push({
        status: 'out_for_delivery',
        comment: `Picked up by delivery partner ${req.user.name}. Out for delivery!`,
        updatedBy: req.user._id
      });

      // Update global order status if applicable
      if (order.status === 'pending' || order.status === 'processing') {
        order.status = 'processing';
      }

      await order.save();

      // Notify customer with delivery OTP
      try {
        await Notification.create({
          user: order.customer._id || order.customer,
          title: 'Out for Delivery 📦',
          message: `Your order #${order.orderNumber} has been picked up by ${req.user.name} and is on the way! Your Delivery OTP is ${sellerOrder.deliveryOtp}.`,
          type: 'order',
          link: `/customer-dashboard.html?tab=orders&id=${order._id}`
        });
      } catch (notifErr) {
        console.warn('Could not send notification:', notifErr.message);
      }

      return ApiResponse.success(
        res,
        {
          orderId: order._id,
          sellerStatus: 'out_for_delivery',
          customerName: order.deliveryAddress.recipientName,
          customerPhone: order.deliveryAddress.phone,
          deliveryAddress: order.deliveryAddress,
          deliveryOtpHint: 'Ask customer for 4-digit Delivery OTP upon arrival'
        },
        'Order marked Out for Delivery! Proceed to customer location.'
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * Complete Delivery (Confirm with OTP)
   */
  async completeDelivery(req, res, next) {
    try {
      const { orderId } = req.params;
      const { otp } = req.body;

      const rider = await RiderProfile.findOne({ user: req.user._id });
      if (!rider) {
        return ApiResponse.notFound(res, 'Rider profile not found');
      }

      const order = await Order.findById(orderId).populate('customer', 'name phone');
      if (!order) {
        return ApiResponse.notFound(res, 'Order not found');
      }

      const idx = rider.activeDelivery?.sellerOrderIndex ?? 0;
      const sellerOrder = order.sellerOrders[idx];

      if (!sellerOrder || String(sellerOrder.rider) !== String(req.user._id)) {
        return ApiResponse.forbidden(res, 'You are not assigned to this delivery');
      }

      // Check OTP if provided
      if (otp && sellerOrder.deliveryOtp && otp.trim() !== sellerOrder.deliveryOtp) {
        return ApiResponse.badRequest(res, 'Invalid Delivery OTP! Please ask the customer for the correct 4-digit OTP.');
      }

      sellerOrder.sellerStatus = 'delivered';
      sellerOrder.deliveredAt = new Date();
      sellerOrder.statusHistory.push({
        status: 'delivered',
        comment: `Successfully delivered by ${req.user.name}.`,
        updatedBy: req.user._id
      });

      // Check if all seller orders are delivered
      const allDelivered = order.sellerOrders.every((so) => so.sellerStatus === 'delivered');
      if (allDelivered) {
        order.overallStatus = 'delivered';
        if (order.paymentMethod === 'cod') {
          order.paymentStatus = 'paid';
        }
      }

      // Credit payout to rider
      const payoutAmount = sellerOrder.riderPayout || 40;
      rider.todayEarnings += payoutAmount;
      rider.totalEarnings += payoutAmount;
      rider.todayDeliveries += 1;
      rider.totalDeliveries += 1;
      rider.activeDelivery = null; // Clear active delivery

      await order.save();
      await rider.save();

      // Notify customer
      try {
        await Notification.create({
          user: order.customer._id || order.customer,
          title: 'Order Delivered! 🎉',
          message: `Your order #${order.orderNumber} was delivered successfully by ${req.user.name}. Thank you for shopping with ANMOL STORE!`,
          type: 'order',
          link: `/customer-dashboard.html?tab=orders&id=${order._id}`
        });
      } catch (notifErr) {
        console.warn('Could not send notification:', notifErr.message);
      }

      // Notify seller
      try {
        await Notification.create({
          user: sellerOrder.seller,
          title: 'Order Delivered by Rider! ✅',
          message: `Order #${order.orderNumber} was successfully delivered to customer by ${req.user.name}.`,
          type: 'order',
          link: `/seller-orders.html?id=${order._id}`
        });
      } catch (sellerErr) {
        console.warn('Could not send seller notification:', sellerErr.message);
      }

      return ApiResponse.success(
        res,
        {
          orderId: order._id,
          payoutEarned: payoutAmount,
          todayEarnings: rider.todayEarnings,
          todayDeliveries: rider.todayDeliveries
        },
        `Order delivered successfully! ₹${payoutAmount} credited to your earnings.`
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Delivery History for Rider
   */
  async getHistory(req, res, next) {
    try {
      const orders = await Order.find({
        'sellerOrders.rider': req.user._id,
        'sellerOrders.sellerStatus': 'delivered'
      })
        .populate('customer', 'name phone')
        .populate('sellerOrders.shop', 'name address phone logo')
        .sort({ updatedAt: -1 })
        .limit(50);

      const history = [];
      orders.forEach((order) => {
        order.sellerOrders.forEach((so) => {
          if (String(so.rider) === String(req.user._id) && so.sellerStatus === 'delivered') {
            history.push({
              orderId: order._id,
              orderNumber: order.orderNumber,
              shopName: so.shop?.name || 'Local Shop',
              shopAddress: so.shop?.address?.street || '',
              customerName: order.deliveryAddress?.recipientName || order.customer?.name,
              customerAddress: `${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}`,
              payout: so.riderPayout || 40,
              deliveredAt: so.deliveredAt || so.updatedAt
            });
          }
        });
      });

      return ApiResponse.success(res, history, 'Rider delivery history fetched');
    } catch (err) {
      next(err);
    }
  }
};
