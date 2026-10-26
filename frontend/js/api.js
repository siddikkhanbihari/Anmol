// ANMOL STORE - Centralized API Service Wrapper
import { CONFIG } from './config.js';
import { notify } from './notifications.js';

class ApiService {
  constructor() {
    this.baseUrl = CONFIG.API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  }

  setToken(token) {
    if (token) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    // If options.body is FormData, don't set Content-Type so browser sets boundary
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const config = {
      ...options,
      headers,
      credentials: 'include' // For HttpOnly refresh token cookie
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If 401 Unauthorized, handle expired token
        if (response.status === 401) {
          // Token expired or invalid
          if (token && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
            const refreshed = await this.refreshToken();
            if (refreshed) {
              // Retry original request once
              headers['Authorization'] = `Bearer ${this.getToken()}`;
              const retryResponse = await fetch(url, { ...config, headers });
              return await retryResponse.json();
            } else {
              this.setToken(null);
              localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
            }
          }
        }

        const errorMessage = data.message || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      // Don't show toast for silent check endpoints
      if (!options.silent) {
        console.error(`API Error [${endpoint}]:`, err);
      }
      throw err;
    }
  }

  async refreshToken() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data?.accessToken) {
          this.setToken(data.data.accessToken);
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options
    });
  }

  patch(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options
    });
  }

  put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
}

export const api = new ApiService();
