// ANMOL STORE - Cart Controller
import { Cart, Product } from '../models/index.js';
import { ApiResponse } from '../utils/apiResponse.js';

export async function getCart(req, res, next) {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        populate: { path: 'shop', select: 'name slug deliveryCharge address isVerified' }
      })
      .populate('items.shop', 'name slug deliveryCharge address isVerified');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    return ApiResponse.success(res, cart);
  } catch (err) {
    next(err);
  }
}

export async function addItem(req, res, next) {
  try {
    const { productId, quantity = 1, variant } = req.body;

    const product = await Product.findById(productId).populate('shop');
    if (!product || !product.isActive) {
      return ApiResponse.badRequest(res, 'Product not found or currently unavailable');
    }

    if (product.stock < quantity) {
      return ApiResponse.badRequest(res, `Only ${product.stock} units available in stock`);
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId &&
                JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + Number(quantity);
      if (product.stock < newQty) {
        return ApiResponse.badRequest(res, `Cannot add more. Total in cart exceeds stock of ${product.stock}`);
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].priceSnapshot = product.price;
    } else {
      cart.items.push({
        product: product._id,
        shop: product.shop._id,
        quantity: Number(quantity),
        variant: variant || null,
        priceSnapshot: product.price
      });
    }

    await cart.save();
    return getCart(req, res, next);
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req, res, next) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (Number(quantity) <= 0) {
      return removeItem(req, res, next);
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return ApiResponse.notFound(res, 'Cart not found');
    }

    const item = cart.items.id(id);
    if (!item) {
      return ApiResponse.notFound(res, 'Item not found in cart');
    }

    const product = await Product.findById(item.product);
    if (!product || product.stock < Number(quantity)) {
      return ApiResponse.badRequest(res, `Insufficient stock. Only ${product ? product.stock : 0} available.`);
    }

    item.quantity = Number(quantity);
    item.priceSnapshot = product.price;
    await cart.save();

    return getCart(req, res, next);
  } catch (err) {
    next(err);
  }
}

export async function removeItem(req, res, next) {
  try {
    const { id } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return ApiResponse.notFound(res, 'Cart not found');
    }

    cart.items.pull({ _id: id });
    await cart.save();

    return getCart(req, res, next);
  } catch (err) {
    next(err);
  }
}

export async function clearCart(req, res, next) {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    return ApiResponse.success(res, { items: [] }, 'Cart cleared');
  } catch (err) {
    next(err);
  }
}

export async function syncCart(req, res, next) {
  try {
    const { items = [] } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const pId = item.productId || item.product?._id || item.product;
        const qty = Math.max(1, Number(item.quantity) || 1);
        const variant = item.variant || null;
        if (!pId) continue;

        const product = await Product.findById(pId).populate('shop');
        if (!product || !product.isActive) continue;

        const existingIndex = cart.items.findIndex(
          (i) => i.product.toString() === pId.toString() &&
                 JSON.stringify(i.variant) === JSON.stringify(variant)
        );

        if (existingIndex > -1) {
          cart.items[existingIndex].quantity = Math.min(product.stock, cart.items[existingIndex].quantity + qty);
          cart.items[existingIndex].priceSnapshot = product.price;
        } else {
          cart.items.push({
            product: product._id,
            shop: product.shop?._id,
            quantity: Math.min(product.stock, qty),
            variant,
            priceSnapshot: product.price
          });
        }
      }
      await cart.save();
    }

    return getCart(req, res, next);
  } catch (err) {
    next(err);
  }
}

