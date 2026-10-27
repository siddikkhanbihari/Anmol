// ANMOL STORE - Order Controller
import { Order, Product, Shop, Cart, Notification, Payment, User, RiderProfile } from '../models/index.js';
import { ApiResponse } from '../utils/apiResponse.js';

export async function createOrder(req, res, next) {
  try {
    const { items, deliveryAddress, paymentMethod = 'cod', couponCode, notes } = req.body;

    if (!items || !items.length) {
      return ApiResponse.badRequest(res, 'Order must contain at least one item');
    }

    if (!deliveryAddress || !deliveryAddress.recipientName || !deliveryAddress.phone || !deliveryAddress.street || !deliveryAddress.pincode) {
      return ApiResponse.badRequest(res, 'Complete delivery address and phone number are required');
    }

    // Server-side validation of products and stock
    const productIds = items.map(item => item.productId || item.product?._id || item.product);
    const products = await Product.find({ _id: { $in: productIds } }).populate('shop');

    const productMap = new Map();
    products.forEach(p => productMap.set(p._id.toString(), p));

    // Validate each item and check stock
    const sellerGroupsMap = new Map();
    let calculatedSubtotal = 0;

    for (const item of items) {
      const pId = (item.productId || item.product?._id || item.product).toString();
      const product = productMap.get(pId);

      if (!product || !product.isActive) {
        return ApiResponse.badRequest(res, `Product "${item.name || 'Selected item'}" is no longer available.`);
      }

      const qty = Number(item.quantity);
      if (product.stock < qty) {
        return ApiResponse.badRequest(res, `Not enough stock for "${product.name}". Only ${product.stock} left.`);
      }

      const itemPrice = product.price; // Always use server price!
      const totalItemPrice = itemPrice * qty;
      calculatedSubtotal += totalItemPrice;

      const shopId = product.shop._id.toString();
      if (!sellerGroupsMap.has(shopId)) {
        sellerGroupsMap.set(shopId, {
          shop: product.shop._id,
          seller: product.shop.user,
          items: [],
          subtotal: 0,
          deliveryFee: product.shop.deliveryCharge || 40,
          sellerStatus: 'pending',
          statusHistory: [
            {
              status: 'pending',
              timestamp: new Date(),
              comment: 'Order placed by customer'
            }
          ]
        });
      }

      const group = sellerGroupsMap.get(shopId);
      group.items.push({
        product: product._id,
        name: product.name,
        price: itemPrice,
        quantity: qty,
        image: product.images && product.images.length ? product.images[0] : null,
        variant: item.variant || null,
        totalItemPrice
      });
      group.subtotal += totalItemPrice;
    }

    // Build seller order groups
    let calculatedDeliveryFee = 0;
    const sellerOrders = [];

    for (const group of sellerGroupsMap.values()) {
      group.groupTotal = group.subtotal + group.deliveryFee;
      calculatedDeliveryFee += group.deliveryFee;
      sellerOrders.push(group);
    }

    const grandTotal = calculatedSubtotal + calculatedDeliveryFee;

    // Generate readable order number
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `ANM-${dateStr}-${randomDigits}`;

    // Create Order
    const order = await Order.create({
      orderNumber,
      customer: req.user._id,
      sellerOrders,
      deliveryAddress,
      subtotal: calculatedSubtotal,
      totalDeliveryFee: calculatedDeliveryFee,
      totalAmount: grandTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      overallStatus: 'placed',
      notes
    });

    // Atomically decrement stock
    for (const item of items) {
      const pId = item.productId || item.product?._id || item.product;
      await Product.findByIdAndUpdate(pId, {
        $inc: { stock: -Number(item.quantity) }
      });
    }

    // Clear cart if ordered from cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Create Payment record
    await Payment.create({
      order: order._id,
      customer: req.user._id,
      gateway: paymentMethod,
      transactionId: `TXN-${orderNumber}`,
      amount: grandTotal,
      status: paymentMethod === 'cod' ? 'pending' : 'success'
    });

    // Notify customer
    await Notification.create({
      user: req.user._id,
      title: 'Order Confirmed!',
      message: `Your order #${orderNumber} for ₹${grandTotal} has been placed successfully.`,
      type: 'order',
      link: `/customer-dashboard.html?tab=orders&id=${order._id}`
    });

    // Notify each seller
    for (const group of sellerOrders) {
      await Notification.create({
        user: group.seller,
        title: '🔔 New Customer Order Received!',
        message: `New order #${orderNumber} received for ₹${group.groupTotal}. Please review and prepare for pickup.`,
        type: 'order',
        link: `/seller-orders.html?id=${order._id}`
      });
    }

    // Notify all active delivery riders in the fleet
    try {
      const activeRiders = await User.find({ role: 'rider', status: 'active' });
      for (const r of activeRiders) {
        await Notification.create({
          user: r._id,
          title: '🛵 New Delivery Order in Palanpur!',
          message: `New order #${orderNumber} is waiting for pickup. Earn ₹40 payout. Tap to view & accept!`,
          type: 'order',
          link: `/rider-dashboard.html`
        });
      }
    } catch (riderNotifErr) {
      console.warn('Could not notify riders on order placement:', riderNotifErr.message);
    }

    return ApiResponse.created(res, order, 'Order placed successfully');
  } catch (err) {
    next(err);
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('sellerOrders.shop', 'name slug logo contactPhone')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, orders);
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const isId = id.match(/^[0-9a-fA-F]{24}$/);

    const order = await Order.findOne(isId ? { _id: id } : { orderNumber: id })
      .populate('customer', 'name email phone')
      .populate('sellerOrders.shop', 'name slug logo address contactPhone');

    if (!order) {
      return ApiResponse.notFound(res, 'Order not found');
    }

    // Access control: Customer who placed it, Sellers included in the order, or Admin
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isSeller = order.sellerOrders.some(
      g => g.seller.toString() === req.user._id.toString()
    );

    if (!isCustomer && !isAdmin && !isSeller) {
      return ApiResponse.forbidden(res, 'You are not authorized to view this order');
    }

    // If seller (and not admin or customer), filter sellerOrders to only show their shop
    if (isSeller && !isAdmin && !isCustomer) {
      const filtered = order.toObject();
      filtered.sellerOrders = filtered.sellerOrders.filter(
        g => g.seller.toString() === req.user._id.toString()
      );
      return ApiResponse.success(res, filtered);
    }

    return ApiResponse.success(res, order);
  } catch (err) {
    next(err);
  }
}

export async function getSellerOrders(req, res, next) {
  try {
    let shop = await Shop.findOne({ user: req.user._id });
    if (!shop && req.user.role === 'admin') {
      shop = await Shop.findOne();
    }
    if (!shop) {
      return ApiResponse.forbidden(res, 'No shop found for your seller account');
    }

    const { status, page = 1, limit = 20 } = req.query;

    const query = { 'sellerOrders.shop': shop._id };

    const orders = await Order.find(query)
      .populate('customer', 'name phone email')
      .populate('sellerOrders.shop', 'name slug')
      .sort({ createdAt: -1 });

    // Extract seller-specific portion of each order
    const sellerOrdersList = [];
    orders.forEach(order => {
      order.sellerOrders.forEach(group => {
        if (group.shop._id.toString() === shop._id.toString()) {
          if (!status || group.sellerStatus === status) {
            sellerOrdersList.push({
              _id: group._id,
              orderId: order._id,
              orderNumber: order.orderNumber,
              customer: order.customer,
              deliveryAddress: order.deliveryAddress,
              paymentMethod: order.paymentMethod,
              paymentStatus: order.paymentStatus,
              items: group.items,
              subtotal: group.subtotal,
              deliveryFee: group.deliveryFee,
              groupTotal: group.groupTotal,
              sellerStatus: group.sellerStatus,
              rejectionReason: group.rejectionReason,
              statusHistory: group.statusHistory,
              createdAt: order.createdAt
            });
          }
        }
      });
    });

    return ApiResponse.success(res, {
      orders: sellerOrdersList,
      total: sellerOrdersList.length
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSellerOrderStatus(req, res, next) {
  try {
    const { id } = req.params; // Order ID or group ID
    const { status, comment, rejectionReason } = req.body;

    const validStatuses = ['accepted', 'processing', 'ready_for_pickup', 'out_for_delivery', 'shipped', 'delivered', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return ApiResponse.badRequest(res, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }

    const shop = await Shop.findOne({ user: req.user._id });
    if (!shop && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'Only verified sellers or admins can update order status');
    }

    const order = await Order.findOne({
      $or: [{ _id: id }, { 'sellerOrders._id': id }]
    });

    if (!order) {
      return ApiResponse.notFound(res, 'Order not found');
    }

    // Find the matching seller group
    const group = order.sellerOrders.find(
      g => (shop && (g.shop?._id || g.shop).toString() === shop._id.toString()) ||
           (g.seller && g.seller.toString() === req.user._id.toString()) ||
           g._id.toString() === id
    );

    if (!group) {
      return ApiResponse.forbidden(res, 'This order does not belong to your shop');
    }

    group.sellerStatus = status;
    if (rejectionReason) group.rejectionReason = rejectionReason;
    if (status === 'delivered') group.deliveredAt = new Date();

    group.statusHistory.push({
      status,
      timestamp: new Date(),
      comment: comment || `Status updated to ${status}`,
      updatedBy: req.user._id
    });

    // Check if overall order status should update
    const allStatuses = order.sellerOrders.map(g => g.sellerStatus);
    if (allStatuses.every(s => s === 'delivered')) {
      order.overallStatus = 'delivered';
      if (order.paymentMethod === 'cod') order.paymentStatus = 'paid';
    } else if (allStatuses.some(s => s === 'shipped' || s === 'delivered')) {
      order.overallStatus = 'partially_shipped';
    } else if (allStatuses.every(s => s === 'cancelled' || s === 'rejected')) {
      order.overallStatus = 'cancelled';
    }

    await order.save();

    // Notify customer of update
    await Notification.create({
      user: order.customer,
      title: `Order Update: #${order.orderNumber}`,
      message: `Your items from ${shop ? shop.name : 'seller'} have been updated to: ${status.toUpperCase()}.`,
      type: 'order',
      link: `/customer-dashboard.html?tab=orders&id=${order._id}`
    });

    // If order was accepted or marked ready for pickup, notify available riders
    if (['accepted', 'processing', 'ready_for_pickup'].includes(status) && !group.rider) {
      try {
        const riders = await User.find({ role: 'rider', status: 'active' });
        for (const r of riders) {
          await Notification.create({
            user: r._id,
            title: '📦 Order Ready for Pickup in Palanpur!',
            message: `Order #${order.orderNumber} is ready at ${shop ? shop.name : 'Local Store'}. Earn ₹40 payout!`,
            type: 'order',
            link: `/rider-dashboard.html`
          });
        }
      } catch (errRider) {
        console.warn('Could not notify riders on status update:', errRider.message);
      }
    }

    return ApiResponse.success(res, order, `Order status updated to ${status}`);
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: id, customer: req.user._id });
    if (!order) {
      return ApiResponse.notFound(res, 'Order not found');
    }

    if (order.overallStatus === 'shipped' || order.overallStatus === 'delivered') {
      return ApiResponse.badRequest(res, 'Cannot cancel order that has already shipped or delivered.');
    }

    order.overallStatus = 'cancelled';
    order.sellerOrders.forEach(g => {
      if (g.sellerStatus === 'pending' || g.sellerStatus === 'accepted') {
        g.sellerStatus = 'cancelled';
        g.statusHistory.push({
          status: 'cancelled',
          timestamp: new Date(),
          comment: `Cancelled by customer: ${reason || 'Customer request'}`
        });
      }
    });

    await order.save();

    // Restore stock
    for (const group of order.sellerOrders) {
      for (const item of group.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    return ApiResponse.success(res, order, 'Order cancelled successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * Get Real-time Live Tracking Data for an Order
 * Returns Shop, Rider Live GPS, and Customer Delivery Coordinates
 */
export async function getOrderLiveTracking(req, res, next) {
  try {
    const { id } = req.params;
    const isId = id.match(/^[0-9a-fA-F]{24}$/);

    const order = await Order.findOne(isId ? { _id: id } : { orderNumber: id })
      .populate('customer', 'name phone email')
      .populate('sellerOrders.shop', 'name slug address contactPhone logo')
      .populate('sellerOrders.rider', 'name phone avatar')
      .populate('sellerOrders.riderProfile');

    if (!order) {
      return ApiResponse.notFound(res, 'Order not found');
    }

    // Access authorization: Customer, Seller, Rider or Admin
    const isCustomer = order.customer && order.customer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isSeller = order.sellerOrders.some(g => g.seller && g.seller.toString() === req.user._id.toString());
    const isRider = order.sellerOrders.some(g => g.rider && g.rider._id && g.rider._id.toString() === req.user._id.toString());

    if (!isCustomer && !isAdmin && !isSeller && !isRider) {
      return ApiResponse.forbidden(res, 'You are not authorized to view tracking for this order');
    }

    const PALANPUR_AREA_COORDS = {
      'aroma circle': { lat: 24.1800, lng: 72.4380 },
      'highway road': { lat: 24.1830, lng: 72.4410 },
      'gathaman': { lat: 24.1710, lng: 72.4320 },
      'shimla': { lat: 24.1720, lng: 72.4290 },
      'delhi gate': { lat: 24.1740, lng: 72.4310 },
      'mira gate': { lat: 24.1690, lng: 72.4330 },
      'station': { lat: 24.1750, lng: 72.4400 },
      'guru nanak': { lat: 24.1730, lng: 72.4350 },
      'joravar': { lat: 24.1700, lng: 72.4280 },
      'cozy': { lat: 24.1760, lng: 72.4360 },
      'gobari': { lat: 24.1640, lng: 72.4450 },
      'abu highway': { lat: 24.1900, lng: 72.4450 },
      'civil hospital': { lat: 24.1780, lng: 72.4320 },
      'man sarovar': { lat: 24.1660, lng: 72.4360 },
      'ganeshpura': { lat: 24.1680, lng: 72.4220 },
      'malan': { lat: 24.1770, lng: 72.4260 },
      'gidc': { lat: 24.1950, lng: 72.4250 },
      'kanodar': { lat: 24.1500, lng: 72.4100 }
    };

    const defaultCenter = { lat: 24.1724, lng: 72.4346 }; // Palanpur town center

    // Resolve delivery coordinate
    let deliveryCoords = order.deliveryAddress?.location || null;
    if (!deliveryCoords || !deliveryCoords.lat) {
      const addrStr = `${order.deliveryAddress?.street || ''} ${order.deliveryAddress?.city || ''}`.toLowerCase();
      const matchKey = Object.keys(PALANPUR_AREA_COORDS).find(k => addrStr.includes(k));
      deliveryCoords = matchKey ? PALANPUR_AREA_COORDS[matchKey] : { lat: 24.1750, lng: 72.4360 };
    }

    const fulfillments = [];

    for (const group of order.sellerOrders) {
      let shopCoords = group.shop?.location || null;
      if (!shopCoords || !shopCoords.lat) {
        const shopAddrStr = `${group.shop?.address?.street || ''} ${group.shop?.name || ''}`.toLowerCase();
        const matchKey = Object.keys(PALANPUR_AREA_COORDS).find(k => shopAddrStr.includes(k));
        shopCoords = matchKey ? PALANPUR_AREA_COORDS[matchKey] : { lat: 24.1724, lng: 72.4346 };
      }

      let riderInfo = null;
      if (group.rider) {
        let profile = group.riderProfile;
        if (!profile) {
          profile = await RiderProfile.findOne({ user: group.rider._id });
        }

        const riderLocation = (profile?.currentLocation && profile.currentLocation.lat) ? {
          lat: profile.currentLocation.lat,
          lng: profile.currentLocation.lng,
          address: profile.currentLocation.address || 'Palanpur Live Location',
          updatedAt: profile.currentLocation.updatedAt || new Date()
        } : {
          lat: (shopCoords.lat + deliveryCoords.lat) / 2,
          lng: (shopCoords.lng + deliveryCoords.lng) / 2,
          address: 'En route in Palanpur',
          updatedAt: new Date()
        };

        riderInfo = {
          id: group.rider._id,
          name: group.rider.name,
          phone: group.rider.phone,
          avatar: group.rider.avatar,
          vehicleType: profile?.vehicleType || 'Bike',
          vehicleNumber: profile?.vehicleNumber || 'GJ-08-PL-1234',
          rating: profile?.rating || 4.9,
          currentLocation: riderLocation
        };
      }

      let etaMinutes = 35;
      if (group.sellerStatus === 'ready_for_pickup') etaMinutes = 20;
      if (group.sellerStatus === 'shipped') etaMinutes = 10;
      if (group.sellerStatus === 'delivered') etaMinutes = 0;

      fulfillments.push({
        groupId: group._id,
        shop: {
          name: group.shop?.name || 'Local Seller',
          phone: group.shop?.contactPhone,
          address: group.shop?.address?.street || 'Palanpur',
          location: shopCoords
        },
        status: group.sellerStatus,
        statusHistory: group.statusHistory,
        rider: riderInfo,
        etaMinutes,
        deliveryOtp: order.deliveryOtp
      });
    }

    return ApiResponse.success(res, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      overallStatus: order.overallStatus,
      deliveryAddress: {
        recipientName: order.deliveryAddress?.recipientName,
        phone: order.deliveryAddress?.phone,
        street: order.deliveryAddress?.street,
        city: order.deliveryAddress?.city || 'Palanpur',
        pincode: order.deliveryAddress?.pincode || '385001',
        location: deliveryCoords
      },
      fulfillments,
      center: defaultCenter,
      timestamp: new Date()
    });
  } catch (err) {
    next(err);
  }
}
