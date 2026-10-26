// ANMOL STORE - Review Controller
import { Review, Product, Shop, ServiceListing } from '../models/index.js';
import { ApiResponse } from '../utils/apiResponse.js';

export async function createReview(req, res, next) {
  try {
    const { targetType, targetId, rating, comment, title } = req.body;

    if (!targetType || !targetId || !rating || !comment) {
      return ApiResponse.badRequest(res, 'Target type, target ID, rating, and comment are required.');
    }

    const targetModelMap = {
      product: 'Product',
      shop: 'Shop',
      service: 'ServiceListing'
    };

    const targetModel = targetModelMap[targetType];
    if (!targetModel) {
      return ApiResponse.badRequest(res, 'Invalid target type. Must be product, shop, or service.');
    }

    // Check for existing review by this user
    let review = await Review.findOne({ user: req.user._id, targetId });
    if (review) {
      review.rating = Number(rating);
      review.comment = comment;
      review.title = title || review.title;
      await review.save();
    } else {
      review = await Review.create({
        user: req.user._id,
        targetType,
        targetId,
        targetModel,
        rating: Number(rating),
        title,
        comment,
        isVerifiedPurchase: true
      });
    }

    // Recalculate average rating for the target entity
    const allReviews = await Review.find({ targetId, isApproved: true });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    const formattedAvg = Number(avgRating.toFixed(1));

    if (targetType === 'product') {
      await Product.findByIdAndUpdate(targetId, {
        rating: formattedAvg,
        reviewCount: allReviews.length
      });
    } else if (targetType === 'shop') {
      await Shop.findByIdAndUpdate(targetId, {
        rating: formattedAvg,
        reviewCount: allReviews.length
      });
    } else if (targetType === 'service') {
      await ServiceListing.findByIdAndUpdate(targetId, {
        rating: formattedAvg,
        reviewCount: allReviews.length
      });
    }

    return ApiResponse.created(res, review, 'Review submitted successfully');
  } catch (err) {
    next(err);
  }
}

export async function getReviews(req, res, next) {
  try {
    const { targetType, targetId, limit = 10, page = 1 } = req.query;
    const query = { isApproved: true };

    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;

    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(query)
    ]);

    return ApiResponse.success(res, {
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total
      }
    });
  } catch (err) {
    next(err);
  }
}
