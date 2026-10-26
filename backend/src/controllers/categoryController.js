// ANMOL STORE - Category Controller
import { Category } from '../models/index.js';
import { ApiResponse } from '../utils/apiResponse.js';

export async function getCategories(req, res, next) {
  try {
    const { type, featured } = req.query;
    const query = {};
    if (type) query.type = type;
    if (featured === 'true') query.isFeatured = true;

    const categories = await Category.find(query).sort({ order: 1, name: 1 });
    return ApiResponse.success(res, categories);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, description, icon, image, type = 'product', isFeatured } = req.body;
    if (!name) {
      return ApiResponse.badRequest(res, 'Category name is required');
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const category = await Category.create({
      name,
      slug,
      description,
      icon,
      image,
      type,
      isFeatured: isFeatured !== undefined ? isFeatured : true
    });

    return ApiResponse.created(res, category, 'Category created');
  } catch (err) {
    next(err);
  }
}
