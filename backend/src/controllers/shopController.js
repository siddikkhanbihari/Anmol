// ANMOL STORE - Shop Controller
import { Shop, Product, Review } from '../models/index.js';
import { ApiResponse } from '../utils/apiResponse.js';

export async function getShops(req, res, next) {
  try {
    const { category, city, search, sort = 'rating', page = 1, limit = 12 } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = new RegExp(category, 'i');
    }

    if (city) {
      query['address.city'] = new RegExp(city, 'i');
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') },
        { 'address.street': new RegExp(search, 'i') }
      ];
    }

    const sortOptions = {};
    if (sort === 'rating') sortOptions.rating = -1;
    else if (sort === 'newest') sortOptions.createdAt = -1;
    else if (sort === 'name') sortOptions.name = 1;

    const skip = (Number(page) - 1) * Number(limit);

    const [shops, total] = await Promise.all([
      Shop.find(query).sort(sortOptions).skip(skip).limit(Number(limit)),
      Shop.countDocuments(query)
    ]);

    // Attach active product count for each shop
    const shopsWithCount = await Promise.all(
      shops.map(async (shop) => {
        const productCount = await Product.countDocuments({ shop: shop._id, isActive: true });
        return {
          ...shop.toObject(),
          productCount
        };
      })
    );

    return ApiResponse.success(res, {
      shops: shopsWithCount,
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

export async function getShopBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const shop = await Shop.findOne({ slug, isActive: true });

    if (!shop) {
      return ApiResponse.notFound(res, 'Shop not found or inactive');
    }

    // Get active products for this shop
    const products = await Product.find({ shop: shop._id, isActive: true })
      .populate('category', 'name slug')
      .limit(50);

    // Get reviews for this shop
    const reviews = await Review.find({ targetId: shop._id, targetType: 'shop' })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    return ApiResponse.success(res, {
      shop,
      products,
      reviews
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyShop(req, res, next) {
  try {
    const shop = await Shop.findOne({ user: req.user._id });
    if (!shop) {
      return ApiResponse.notFound(res, 'No shop found for your seller account');
    }

    const productCount = await Product.countDocuments({ shop: shop._id });

    return ApiResponse.success(res, {
      shop,
      productCount
    });
  } catch (err) {
    next(err);
  }
}

export async function updateShop(req, res, next) {
  try {
    const { id } = req.params;
    const shop = await Shop.findById(id);

    if (!shop) {
      return ApiResponse.notFound(res, 'Shop not found');
    }

    // Authorization: only the seller who owns the shop or admin
    if (req.user.role !== 'admin' && shop.user.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Unauthorized to update this shop');
    }

    const {
      name,
      description,
      logo,
      coverImage,
      address,
      operatingAreas,
      deliveryPincodes,
      businessHours,
      contactPhone,
      contactEmail,
      deliveryCharge,
      minimumOrderAmount,
      isActive
    } = req.body;

    if (name) shop.name = name;
    if (description) shop.description = description;
    if (logo) shop.logo = logo;
    if (coverImage) shop.coverImage = coverImage;
    if (address) shop.address = { ...shop.address, ...address };
    if (operatingAreas) shop.operatingAreas = operatingAreas;
    if (deliveryPincodes) shop.deliveryPincodes = deliveryPincodes;
    if (businessHours) shop.businessHours = { ...shop.businessHours, ...businessHours };
    if (contactPhone) shop.contactPhone = contactPhone;
    if (contactEmail) shop.contactEmail = contactEmail;
    if (deliveryCharge !== undefined) shop.deliveryCharge = deliveryCharge;
    if (minimumOrderAmount !== undefined) shop.minimumOrderAmount = minimumOrderAmount;
    if (isActive !== undefined) shop.isActive = isActive;

    await shop.save();

    return ApiResponse.success(res, shop, 'Shop details updated successfully');
  } catch (err) {
    next(err);
  }
}
