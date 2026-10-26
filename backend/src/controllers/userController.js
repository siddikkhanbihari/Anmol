// ANMOL STORE - User Controller (Addresses, Notifications, Support)
import { Address, Notification, SupportTicket } from '../models/index.js';
import { ApiResponse } from '../utils/apiResponse.js';

export async function getAddresses(req, res, next) {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    return ApiResponse.success(res, addresses);
  } catch (err) {
    next(err);
  }
}

export async function addAddress(req, res, next) {
  try {
    const { recipientName, phone, street, landmark, city, state, pincode, addressType, isDefault } = req.body;

    if (!recipientName || !phone || !street || !city || !pincode) {
      return ApiResponse.badRequest(res, 'Name, phone, street, city, and PIN code are required');
    }

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    // If this is user's first address, make it default automatically
    const count = await Address.countDocuments({ user: req.user._id });

    const address = await Address.create({
      user: req.user._id,
      recipientName,
      phone,
      street,
      landmark,
      city,
      state: state || 'Uttar Pradesh',
      pincode,
      addressType: addressType || 'Home',
      isDefault: isDefault || count === 0
    });

    return ApiResponse.created(res, address, 'Address added successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateAddress(req, res, next) {
  try {
    const { id } = req.params;
    const address = await Address.findOne({ _id: id, user: req.user._id });
    if (!address) {
      return ApiResponse.notFound(res, 'Address not found');
    }

    const { recipientName, phone, street, landmark, city, state, pincode, addressType, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
      address.isDefault = true;
    }

    if (recipientName) address.recipientName = recipientName;
    if (phone) address.phone = phone;
    if (street) address.street = street;
    if (landmark !== undefined) address.landmark = landmark;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;
    if (addressType) address.addressType = addressType;

    await address.save();
    return ApiResponse.success(res, address, 'Address updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req, res, next) {
  try {
    const { id } = req.params;
    await Address.findOneAndDelete({ _id: id, user: req.user._id });
    return ApiResponse.success(res, null, 'Address deleted successfully');
  } catch (err) {
    next(err);
  }
}

export async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    return ApiResponse.success(res, {
      notifications,
      unreadCount
    });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate({ _id: id, user: req.user._id }, { isRead: true });
    return ApiResponse.success(res, null, 'Marked as read');
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    return ApiResponse.success(res, null, 'All marked as read');
  } catch (err) {
    next(err);
  }
}

export async function submitSupportTicket(req, res, next) {
  try {
    const { name, email, phone, subject, message, category } = req.body;
    if (!name || !email || !subject || !message) {
      return ApiResponse.badRequest(res, 'Name, email, subject, and message are required.');
    }

    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;
    const ticket = await SupportTicket.create({
      ticketNumber,
      user: req.user ? req.user._id : undefined,
      name,
      email,
      phone,
      subject,
      message,
      category: category || 'General Query'
    });

    return ApiResponse.created(res, ticket, `Support ticket #${ticketNumber} created successfully. Our team will contact you shortly.`);
  } catch (err) {
    next(err);
  }
}
