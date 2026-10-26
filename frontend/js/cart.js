// ANMOL STORE - Shopping Cart Manager (Guest + Logged-in Sync)
import { api } from './api.js';
import { auth } from './auth.js';
import { CONFIG } from './config.js';
import { notify } from './notifications.js';

class CartManager {
  constructor() {
    this.cart = this.loadLocalCart();
    this.listeners = [];
  }

  loadLocalCart() {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE_KEYS.GUEST_CART);
      return data ? JSON.parse(data) : { items: [] };
    } catch (e) {
      return { items: [] };
    }
  }

  saveLocalCart(cart) {
    this.cart = cart;
    localStorage.setItem(CONFIG.STORAGE_KEYS.GUEST_CART, JSON.stringify(cart));
    this.notifyChange();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyChange() {
    this.listeners.forEach(cb => cb(this.cart));
    this.updateBadges();
  }

  updateBadges() {
    const badges = document.querySelectorAll('.cart-badge-count');
    const count = this.getItemCount();
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  getItemCount() {
    if (!this.cart?.items) return 0;
    return this.cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  async fetchCart() {
    if (auth.isAuthenticated()) {
      try {
        const res = await api.get('/cart', { silent: true });
        if (res.success && res.data) {
          this.cart = res.data;
          this.notifyChange();
          return this.cart;
        }
      } catch (err) {
        // Fall back to local
      }
    }
    this.cart = this.loadLocalCart();
    this.notifyChange();
    return this.cart;
  }

  async addItem(product, quantity = 1, variant = null) {
    if (auth.isAuthenticated()) {
      try {
        const res = await api.post('/cart/items', {
          productId: product._id || product.id,
          quantity,
          variant
        });
        if (res.success) {
          this.cart = res.data;
          this.notifyChange();
          notify.success(`Added "${product.name}" to cart!`);
          return true;
        }
      } catch (err) {
        notify.error(err.message || 'Could not add product to cart');
        return false;
      }
    }

    // Guest Cart
    const items = [...(this.cart.items || [])];
    const pId = product._id || product.id;
    const existingIndex = items.findIndex(
      item => (item.product?._id || item.product?.id || item.productId) === pId &&
              JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        _id: 'local_' + Date.now() + Math.random().toString(36).substr(2, 5),
        product: {
          _id: pId,
          id: pId,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images || [product.image],
          shop: product.shop,
          stock: product.stock
        },
        quantity,
        variant,
        priceSnapshot: product.price
      });
    }

    this.saveLocalCart({ items });
    notify.success(`Added "${product.name}" to cart!`);
    return true;
  }

  async updateQuantity(itemId, quantity) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    if (auth.isAuthenticated()) {
      try {
        const res = await api.patch(`/cart/items/${itemId}`, { quantity });
        if (res.success) {
          this.cart = res.data;
          this.notifyChange();
          return true;
        }
      } catch (err) {
        notify.error(err.message || 'Failed to update quantity');
        return false;
      }
    }

    const items = (this.cart.items || []).map(item => {
      if (item._id === itemId || item.product?._id === itemId) {
        return { ...item, quantity };
      }
      return item;
    });

    this.saveLocalCart({ items });
    return true;
  }

  async removeItem(itemId) {
    if (auth.isAuthenticated()) {
      try {
        const res = await api.delete(`/cart/items/${itemId}`);
        if (res.success) {
          this.cart = res.data;
          this.notifyChange();
          notify.info('Item removed from cart');
          return true;
        }
      } catch (err) {
        notify.error(err.message || 'Failed to remove item');
        return false;
      }
    }

    const items = (this.cart.items || []).filter(
      item => item._id !== itemId && item.product?._id !== itemId
    );
    this.saveLocalCart({ items });
    notify.info('Item removed from cart');
    return true;
  }

  async clearCart() {
    if (auth.isAuthenticated()) {
      try {
        await api.delete('/cart', { silent: true });
      } catch (e) {}
    }
    this.saveLocalCart({ items: [] });
  }

  /**
   * Group cart items by seller/shop for multi-seller checkout
   */
  getSellerGroups() {
    const groups = {};
    (this.cart.items || []).forEach(item => {
      const shop = item.product?.shop || item.shop || { _id: 'general', name: 'ANMOL Direct' };
      const shopId = shop._id || shop.id || 'general';
      if (!groups[shopId]) {
        groups[shopId] = {
          shop,
          items: [],
          subtotal: 0,
          deliveryFee: 40 // Default standard delivery fee per seller
        };
      }
      const itemTotal = (item.priceSnapshot || item.product?.price || 0) * item.quantity;
      groups[shopId].items.push(item);
      groups[shopId].subtotal += itemTotal;
    });
    return Object.values(groups);
  }

  getTotals() {
    const groups = this.getSellerGroups();
    const subtotal = groups.reduce((acc, g) => acc + g.subtotal, 0);
    const totalDeliveryFee = groups.length > 0 ? groups.reduce((acc, g) => acc + g.deliveryFee, 0) : 0;
    const grandTotal = subtotal + totalDeliveryFee;
    return {
      subtotal,
      deliveryFee: totalDeliveryFee,
      grandTotal,
      groupsCount: groups.length
    };
  }
}

export const cart = new CartManager();
