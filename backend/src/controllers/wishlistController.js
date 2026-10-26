// ANMOL STORE - Wishlist Controller
import { Wishlist, Product } from '../models/index.js';
import { ApiResponse } from '../utils/apiResponse.js';

export async function getWishlist(req, res, next) {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'products',
        populate: { path: 'shop', select: 'name slug rating' }
      });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    return ApiResponse.success(res, wishlist);
  } catch (err) {
    next(err);
  }
}

export async function addToWishlist(req, res, next) {
  try {
    const { productId } = req.body;
    if (!productId) {
      return ApiResponse.badRequest(res, 'Product ID is required');
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    return getWishlist(req, res, next);
  } catch (err) {
    next(err);
  }
}

export async function removeFromWishlist(req, res, next) {
  try {
    const { id } = req.params;
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products.pull(id);
      await wishlist.save();
    }
    return getWishlist(req, res, next);
  } catch (err) {
    next(err);
  }
}
