// ANMOL STORE - Service Controller & Bookings
import { ServiceListing, ServiceBooking, Shop, Notification } from '../models/index.js';
import { ApiResponse } from '../utils/apiResponse.js';

export async function getServices(req, res, next) {
  try {
    const { category, serviceType, city, search, page = 1, limit = 12 } = req.query;

    const query = { isActive: true, isApproved: true };

    if (serviceType) {
      query.serviceType = serviceType;
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { serviceType: new RegExp(search, 'i') }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [services, total] = await Promise.all([
      ServiceListing.find(query)
        .populate('provider', 'name phone')
        .populate('shop', 'name slug address rating isVerified')
        .sort({ rating: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ServiceListing.countDocuments(query)
    ]);

    return ApiResponse.success(res, {
      services,
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

export async function getServiceById(req, res, next) {
  try {
    const { id } = req.params;
    const service = await ServiceListing.findById(id)
      .populate('provider', 'name phone')
      .populate('shop', 'name slug address rating isVerified contactPhone operatingAreas');

    if (!service) {
      return ApiResponse.notFound(res, 'Service listing not found');
    }

    return ApiResponse.success(res, service);
  } catch (err) {
    next(err);
  }
}

export async function createService(req, res, next) {
  try {
    const shop = await Shop.findOne({ user: req.user._id });
    if (!shop) {
      return ApiResponse.forbidden(res, 'Shop profile required to offer services');
    }

    const {
      title,
      description,
      serviceType,
      pricingModel = 'starting_at',
      price,
      serviceArea,
      durationMinutes,
      images,
      category
    } = req.body;

    if (!title || !description || !serviceType || price === undefined) {
      return ApiResponse.badRequest(res, 'Title, description, service type, and price are required.');
    }

    // Default category ID if none provided
    const catId = category || (await import('../models/Category.js')).Category.findOne({ type: 'service' });

    const service = await ServiceListing.create({
      provider: req.user._id,
      shop: shop._id,
      category: catId?._id || catId,
      serviceType,
      title,
      description,
      pricingModel,
      price: Number(price),
      serviceArea: serviceArea || `${shop.address.city} and surrounding areas`,
      durationMinutes: durationMinutes || 60,
      images: images && images.length ? images : ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'],
      isApproved: true,
      isActive: true
    });

    return ApiResponse.created(res, service, 'Service listed successfully');
  } catch (err) {
    next(err);
  }
}

export async function createServiceBooking(req, res, next) {
  try {
    const { serviceId, bookingDate, timeSlot, serviceAddress, customerPhone, problemDescription } = req.body;

    if (!serviceId || !bookingDate || !timeSlot || !serviceAddress || !problemDescription) {
      return ApiResponse.badRequest(res, 'All booking details (service, date, time slot, address, problem description) are required.');
    }

    const service = await ServiceListing.findById(serviceId).populate('shop');
    if (!service) {
      return ApiResponse.notFound(res, 'Service not found');
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `SRV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomNum}`;

    const booking = await ServiceBooking.create({
      bookingReference,
      service: service._id,
      customer: req.user._id,
      provider: service.provider,
      shop: service.shop._id,
      bookingDate: new Date(bookingDate),
      timeSlot,
      serviceAddress,
      customerPhone: customerPhone || req.user.phone,
      problemDescription,
      estimatedCost: service.price,
      status: 'pending'
    });

    // Notify customer
    await Notification.create({
      user: req.user._id,
      title: 'Service Appointment Requested',
      message: `Your booking #${bookingReference} for ${service.title} has been requested for ${new Date(bookingDate).toLocaleDateString('en-IN')}, slot: ${timeSlot}.`,
      type: 'booking'
    });

    // Notify provider
    await Notification.create({
      user: service.provider,
      title: 'New Service Booking Request!',
      message: `Booking #${bookingReference} requested by ${req.user.name} for ${service.title}.`,
      type: 'booking'
    });

    return ApiResponse.created(res, booking, 'Service appointment requested successfully');
  } catch (err) {
    next(err);
  }
}

export async function getMyServiceBookings(req, res, next) {
  try {
    const bookings = await ServiceBooking.find({ customer: req.user._id })
      .populate('service', 'title serviceType images price')
      .populate('shop', 'name address contactPhone')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, bookings);
  } catch (err) {
    next(err);
  }
}

export async function getProviderBookings(req, res, next) {
  try {
    const bookings = await ServiceBooking.find({ provider: req.user._id })
      .populate('service', 'title serviceType price')
      .populate('customer', 'name phone email')
      .sort({ bookingDate: 1 });

    return ApiResponse.success(res, bookings);
  } catch (err) {
    next(err);
  }
}

export async function updateBookingStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, finalCost, providerNotes, cancellationReason } = req.body;

    const booking = await ServiceBooking.findById(id);
    if (!booking) {
      return ApiResponse.notFound(res, 'Booking not found');
    }

    // Access control
    if (booking.provider.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'Not authorized to update this booking');
    }

    if (status) booking.status = status;
    if (finalCost !== undefined) booking.finalCost = Number(finalCost);
    if (providerNotes) booking.providerNotes = providerNotes;
    if (cancellationReason) booking.cancellationReason = cancellationReason;

    await booking.save();

    // Notify customer
    await Notification.create({
      user: booking.customer,
      title: `Booking Update: #${booking.bookingReference}`,
      message: `Your service booking status is now: ${status.toUpperCase()}.`,
      type: 'booking'
    });

    return ApiResponse.success(res, booking, `Booking updated to ${status}`);
  } catch (err) {
    next(err);
  }
}
