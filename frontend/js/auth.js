// ANMOL STORE - Authentication & Session State Management
import { api } from './api.js';
import { CONFIG } from './config.js';
import { notify } from './notifications.js';

class AuthService {
  constructor() {
    this.user = this.loadStoredUser();
    this.listeners = [];
  }

  loadStoredUser() {
    try {
      const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.user && !!api.getToken();
  }

  isCustomer() {
    return this.isAuthenticated() && this.user?.role === 'customer';
  }

  isSeller() {
    return this.isAuthenticated() && this.user?.role === 'seller';
  }

  isAdmin() {
    return this.isAuthenticated() && this.user?.role === 'admin';
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.user));
  }

  async login(email, password) {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success && res.data) {
        api.setToken(res.data.accessToken);
        this.user = res.data.user;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(this.user));
        this.notifyListeners();
        return { success: true, user: this.user };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Login failed. Please check credentials.' };
    }
  }

  async register(customerData) {
    try {
      const res = await api.post('/auth/register', { ...customerData, role: 'customer' });
      if (res.success && res.data) {
        api.setToken(res.data.accessToken);
        this.user = res.data.user;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(this.user));
        this.notifyListeners();
        return { success: true, user: this.user };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  }

  async registerSeller(sellerPayload) {
    try {
      const res = await api.post('/auth/register-seller', sellerPayload);
      if (res.success && res.data) {
        api.setToken(res.data.accessToken);
        this.user = res.data.user;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(this.user));
        this.notifyListeners();
        return { success: true, user: this.user, shop: res.data.shop };
      }
      return { success: false, message: res.message || 'Seller registration failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Seller registration failed' };
    }
  }

  async logout() {
    try {
      await api.post('/auth/logout', {}, { silent: true });
    } catch (e) {
      // Continue client cleanup even if network fails
    } finally {
      api.setToken(null);
      this.user = null;
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
      this.notifyListeners();
      window.location.href = '/login.html';
    }
  }

  async fetchCurrentUser() {
    if (!api.getToken()) {
      this.user = null;
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
      return null;
    }
    try {
      const res = await api.get('/auth/me', { silent: true });
      if (res.success && res.data) {
        this.user = res.data.user;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(this.user));
        this.notifyListeners();
        return this.user;
      }
    } catch (err) {
      this.user = null;
      api.setToken(null);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
    }
    return null;
  }

  requireAuth(allowedRoles = []) {
    if (!this.isAuthenticated()) {
      const current = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login.html?redirect=${current}`;
      return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(this.user?.role)) {
      notify.error('Access denied. You do not have permission to view this page.');
      if (this.user?.role === 'seller') {
        window.location.href = '/seller-dashboard.html';
      } else if (this.user?.role === 'admin') {
        window.location.href = '/admin-dashboard.html';
      } else {
        window.location.href = '/customer-dashboard.html';
      }
      return false;
    }

    return true;
  }
}

export const auth = new AuthService();
