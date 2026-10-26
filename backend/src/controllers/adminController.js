// ANMOL STORE - Admin Controller
import {
  User,
  SellerProfile,
  Shop,
  Product,
  Order,
  ServiceListing,
  ServiceBooking,
  VehicleListing,
  PlatformSettings,
  AuditLog,
  Notification
} from '../models/index.js';
import { ApiResponse } from '../utils/apiResponse.js';

export async function getOverview(req, res, next) {
  try {
    const [
      totalCustomers,
      totalSellers,
      pendingSellers,
      activeProducts,
      activeServices,
      activeVehicles,
      totalOrders,
      ordersAgg,
      totalBookings
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'seller' }),
      SellerProfile.countDocuments({ approvalStatus: 'pending' }),
      Product.countDocuments({ isActive: true, isApproved: true }),
      ServiceListing.countDocuments({ isActive: true, isApproved: true }),
      VehicleListing.countDocuments({ isActive: true, isApproved: true }),
      Order.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalGrossValue: { $sum: '$totalAmount' },
            totalDeliveryCharges: { $sum: '$totalDeliveryFee' }
          }
        }
      ]),
      ServiceBooking.countDocuments()
    ]);

    const recentOrders = await Order.find()
      .populate('customer', 'name email')
      .populate('sellerOrders.shop', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    const recentAuditLogs = await AuditLog.find()
      .populate('admin', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    return ApiResponse.success(res, {
      metrics: {
        totalCustomers,
        totalSellers,
        pendingSellers,
        activeProducts,
        activeServices,
        activeVehicles,
        totalOrders,
        totalBookings,
        grossMerchandiseValue: ordersAgg[0]?.totalGrossValue || 0,
        totalDeliveryCharges: ordersAgg[0]?.totalDeliveryCharges || 0
      },
      recentOrders,
      recentAuditLogs
    });
  } catch (err) {
    next(err);
  }
}

export async function getSellers(req, res, next) {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status) query.approvalStatus = status;

    const sellers = await SellerProfile.find(query)
      .populate('user', 'name email phone status createdAt avatar')
      .sort({ createdAt: -1 });

    const sellersWithShops = await Promise.all(
      sellers.map(async (seller) => {
        const shop = await Shop.findOne({ user: seller.user?._id });
        const productCount = shop ? await Product.countDocuments({ shop: shop._id }) : 0;
        return {
          ...seller.toObject(),
          shop,
          productCount
        };
      })
    );

    return ApiResponse.success(res, sellersWithShops);
  } catch (err) {
    next(err);
  }
}

export async function updateSellerStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // 'approved' | 'rejected' | 'pending'

    const sellerProfile = await SellerProfile.findById(id).populate('user');
    if (!sellerProfile) {
      return ApiResponse.notFound(res, 'Seller profile not found');
    }

    sellerProfile.approvalStatus = status;
    if (reason) sellerProfile.rejectionReason = reason;
    if (status === 'approved') sellerProfile.approvedAt = new Date();
    await sellerProfile.save();

    // Update associated shop visibility
    const shop = await Shop.findOne({ user: sellerProfile.user._id });
    if (shop) {
      shop.isVerified = status === 'approved';
      shop.isActive = status === 'approved';
      await shop.save();
    }

    // Log admin action
    await AuditLog.create({
      admin: req.user._id,
      action: `SELLER_${status.toUpperCase()}`,
      targetEntity: 'SellerProfile',
      entityId: sellerProfile._id.toString(),
      details: { businessName: sellerProfile.businessName, reason }
    });

    // Notify seller
    await Notification.create({
      user: sellerProfile.user._id,
      title: `Seller Account ${status.toUpperCase()}`,
      message: status === 'approved'
        ? 'Congratulations! Your shop has been verified and is now live on ANMOL STORE.'
        : `Your seller profile status was updated to: ${status}. Reason: ${reason || 'Compliance check'}`,
      type: 'approval'
    });

    return ApiResponse.success(res, sellerProfile, `Seller status updated to ${status}`);
  } catch (err) {
    next(err);
  }
}

export async function getUsers(req, res, next) {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query)
    ]);

    return ApiResponse.success(res, {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'suspended'

    if (id === req.user._id.toString()) {
      return ApiResponse.badRequest(res, 'You cannot change your own account status');
    }

    const user = await User.findById(id);
    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    user.status = status;
    await user.save();

    await AuditLog.create({
      admin: req.user._id,
      action: `USER_${status.toUpperCase()}`,
      targetEntity: 'User',
      entityId: user._id.toString(),
      details: { email: user.email, name: user.name }
    });

    return ApiResponse.success(res, user, `User status updated to ${status}`);
  } catch (err) {
    next(err);
  }
}

export async function getAllOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.overallStatus = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email phone')
        .populate('sellerOrders.shop', 'name slug contactPhone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query)
    ]);

    return ApiResponse.success(res, {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getPlatformSettings(req, res, next) {
  try {
    let settings = await PlatformSettings.findOne({ key: 'main_settings' });
    if (!settings) {
      settings = await PlatformSettings.create({ key: 'main_settings' });
    }
    return ApiResponse.success(res, settings);
  } catch (err) {
    next(err);
  }
}

export async function updatePlatformSettings(req, res, next) {
  try {
    let settings = await PlatformSettings.findOne({ key: 'main_settings' });
    if (!settings) {
      settings = new PlatformSettings({ key: 'main_settings' });
    }

    const fields = [
      'freeSellerRegistration',
      'autoApproveSellers',
      'defaultDeliveryCharge',
      'freeDeliveryThreshold',
      'commissionRatePercent',
      'codEnabled',
      'onlinePaymentEnabled',
      'maintenanceMode',
      'supportEmail',
      'supportPhone'
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        settings[f] = req.body[f];
      }
    });

    await settings.save();

    await AuditLog.create({
      admin: req.user._id,
      action: 'UPDATE_PLATFORM_SETTINGS',
      targetEntity: 'PlatformSettings',
      details: req.body
    });

    return ApiResponse.success(res, settings, 'Platform settings updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const logs = await AuditLog.find()
      .populate('admin', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    return ApiResponse.success(res, logs);
  } catch (err) {
    next(err);
  }
}
