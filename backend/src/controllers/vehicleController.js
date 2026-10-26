// ANMOL STORE - Vehicle Controller & Inquiries
import { VehicleListing, VehicleInquiry, Shop, Notification } from '../models/index.js';
import { ApiResponse } from '../utils/apiResponse.js';

export async function getVehicles(req, res, next) {
  try {
    const {
      vehicleType,
      make,
      condition,
      fuelType,
      minPrice,
      maxPrice,
      city,
      search,
      page = 1,
      limit = 12
    } = req.query;

    const query = { isActive: true, isApproved: true };

    if (vehicleType) query.vehicleType = vehicleType;
    if (make) query.make = new RegExp(make, 'i');
    if (condition) query.condition = condition;
    if (fuelType) query.fuelType = fuelType;
    if (city) query['location.city'] = new RegExp(city, 'i');

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.askingPrice = {};
      if (minPrice) query.askingPrice.$gte = Number(minPrice);
      if (maxPrice) query.askingPrice.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { make: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [vehicles, total] = await Promise.all([
      VehicleListing.find(query)
        .populate('seller', 'name phone')
        .populate('shop', 'name address')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      VehicleListing.countDocuments(query)
    ]);

    return ApiResponse.success(res, {
      vehicles,
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

export async function getVehicleById(req, res, next) {
  try {
    const { id } = req.params;
    const vehicle = await VehicleListing.findById(id)
      .populate('seller', 'name phone email')
      .populate('shop', 'name address contactPhone rating isVerified');

    if (!vehicle) {
      return ApiResponse.notFound(res, 'Vehicle listing not found');
    }

    return ApiResponse.success(res, vehicle);
  } catch (err) {
    next(err);
  }
}

export async function createVehicle(req, res, next) {
  try {
    const shop = await Shop.findOne({ user: req.user._id });

    const {
      title,
      vehicleType,
      make,
      model,
      variant,
      year,
      condition,
      mileageKm,
      fuelType,
      transmission,
      askingPrice,
      photos,
      location,
      ownership,
      description
    } = req.body;

    if (!title || !vehicleType || !make || !model || !year || !askingPrice || !description) {
      return ApiResponse.badRequest(res, 'Title, vehicle type, make, model, year, asking price, and description are required.');
    }

    const vehicle = await VehicleListing.create({
      seller: req.user._id,
      shop: shop?._id || null,
      title,
      vehicleType,
      make,
      model,
      variant,
      year: Number(year),
      condition: condition || 'used',
      mileageKm: Number(mileageKm || 0),
      fuelType: fuelType || 'Petrol',
      transmission: transmission || 'Manual',
      askingPrice: Number(askingPrice),
      photos: photos && photos.length ? photos : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'],
      location: location || { city: shop ? shop.address.city : 'Kanpur', state: 'Uttar Pradesh' },
      ownership: ownership || '1st Owner',
      description,
      isApproved: true,
      isActive: true
    });

    return ApiResponse.created(res, vehicle, 'Vehicle listed successfully');
  } catch (err) {
    next(err);
  }
}

export async function createVehicleInquiry(req, res, next) {
  try {
    const { vehicleId, customerName, customerPhone, customerEmail, offeredPrice, message } = req.body;

    if (!vehicleId || !customerPhone || !message) {
      return ApiResponse.badRequest(res, 'Vehicle, contact phone number, and message are required.');
    }

    const vehicle = await VehicleListing.findById(vehicleId);
    if (!vehicle) {
      return ApiResponse.notFound(res, 'Vehicle not found');
    }

    const inquiry = await VehicleInquiry.create({
      vehicle: vehicle._id,
      customer: req.user._id,
      seller: vehicle.seller,
      customerName: customerName || req.user.name,
      customerPhone,
      customerEmail: customerEmail || req.user.email,
      offeredPrice: offeredPrice ? Number(offeredPrice) : undefined,
      message,
      status: 'new'
    });

    // Notify seller
    await Notification.create({
      user: vehicle.seller,
      title: 'New Vehicle Buyer Inquiry!',
      message: `${req.user.name} inquired about your ${vehicle.title}. Offer: ₹${offeredPrice || vehicle.askingPrice}.`,
      type: 'inquiry'
    });

    return ApiResponse.created(res, inquiry, 'Your vehicle inquiry has been sent to the seller.');
  } catch (err) {
    next(err);
  }
}

export async function getMyVehicleInquiries(req, res, next) {
  try {
    const inquiries = await VehicleInquiry.find({ customer: req.user._id })
      .populate('vehicle', 'title make model askingPrice photos vehicleType')
      .populate('seller', 'name phone')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, inquiries);
  } catch (err) {
    next(err);
  }
}

export async function getSellerVehicleInquiries(req, res, next) {
  try {
    const inquiries = await VehicleInquiry.find({ seller: req.user._id })
      .populate('vehicle', 'title make model askingPrice photos')
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, inquiries);
  } catch (err) {
    next(err);
  }
}
