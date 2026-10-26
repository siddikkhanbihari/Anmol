// ANMOL STORE - Product Controller
import { Product, Shop, Category, Review } from '../models/index.js';
import { ApiResponse } from '../utils/apiResponse.js';

export async function getProducts(req, res, next) {
  try {
    const {
      search,
      category,
      shop,
      minPrice,
      maxPrice,
      rating,
      inStock,
      sort = 'popularity',
      page = 1,
      limit = 16
    } = req.query;

    const query = { isActive: true, isApproved: true };

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    if (category) {
      // Find category by slug or id
      const catDoc = await Category.findOne({
        $or: [{ _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }, { slug: category }]
      });
      if (catDoc) {
        query.category = catDoc._id;
      }
    }

    if (shop) {
      const shopDoc = await Shop.findOne({
        $or: [{ _id: shop.match(/^[0-9a-fA-F]{24}$/) ? shop : null }, { slug: shop }]
      });
      if (shopDoc) {
        query.shop = shopDoc._id;
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    if (inStock === 'true' || inStock === true) {
      query.stock = { $gt: 0 };
    }

    const sortOptions = {};
    if (sort === 'price_asc') sortOptions.price = 1;
    else if (sort === 'price_desc') sortOptions.price = -1;
    else if (sort === 'rating') sortOptions.rating = -1;
    else if (sort === 'newest') sortOptions.createdAt = -1;
    else sortOptions.reviewCount = -1; // popularity default

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('shop', 'name slug address rating isVerified logo deliveryCharge')
        .populate('category', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query)
    ]);

    return ApiResponse.success(res, {
      products,
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

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const isId = id.match(/^[0-9a-fA-F]{24}$/);

    const product = await Product.findOne(isId ? { _id: id } : { slug: id })
      .populate('shop', 'name slug address rating reviewCount isVerified logo coverImage deliveryCharge operatingAreas businessHours contactPhone')
      .populate('category', 'name slug');

    if (!product) {
      return ApiResponse.notFound(res, 'Product not found');
    }

    // Get related products from same category or same shop
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isActive: true
    })
      .populate('shop', 'name slug rating')
      .limit(6);

    // Get customer reviews
    const reviews = await Review.find({ targetId: product._id, targetType: 'product' })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    return ApiResponse.success(res, {
      product,
      relatedProducts,
      reviews
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyProducts(req, res, next) {
  try {
    const shop = await Shop.findOne({ user: req.user._id });
    if (!shop) {
      return ApiResponse.badRequest(res, 'Shop profile not found for this seller');
    }

    const { page = 1, limit = 20, search } = req.query;
    const query = { shop: shop._id };
    if (search) {
      query.name = new RegExp(search, 'i');
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query)
    ]);

    return ApiResponse.success(res, {
      products,
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

export async function createProduct(req, res, next) {
  try {
    const shop = await Shop.findOne({ user: req.user._id });
    if (!shop) {
      return ApiResponse.forbidden(res, 'You need an active shop to list products.');
    }

    const {
      name,
      description,
      price,
      originalPrice,
      stock,
      category,
      images,
      unit,
      variants,
      tags
    } = req.body;

    if (!name || !description || price === undefined || stock === undefined || !category) {
      return ApiResponse.badRequest(res, 'Name, description, price, stock, and category are required.');
    }

    // Slug generation
    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = slugBase;
    let count = 1;
    while (await Product.findOne({ shop: shop._id, slug })) {
      slug = `${slugBase}-${count++}`;
    }

    const product = await Product.create({
      shop: shop._id,
      seller: req.user._id,
      category,
      name,
      slug,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      stock: Number(stock),
      images: images && images.length ? images : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'],
      unit: unit || 'piece',
      variants: variants || [],
      tags: tags || [],
      isApproved: true,
      isActive: true
    });

    return ApiResponse.created(res, product, 'Product created successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return ApiResponse.notFound(res, 'Product not found');
    }

    // Authorization
    if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'You are not authorized to update this product.');
    }

    const {
      name,
      description,
      price,
      originalPrice,
      stock,
      category,
      images,
      unit,
      variants,
      tags,
      isActive
    } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
    if (stock !== undefined) product.stock = Number(stock);
    if (category) product.category = category;
    if (images) product.images = images;
    if (unit) product.unit = unit;
    if (variants) product.variants = variants;
    if (tags) product.tags = tags;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    return ApiResponse.success(res, product, 'Product updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return ApiResponse.notFound(res, 'Product not found');
    }

    if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'You are not authorized to delete this product.');
    }

    await Product.findByIdAndDelete(id);

    return ApiResponse.success(res, null, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
}
