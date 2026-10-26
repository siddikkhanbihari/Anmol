// ANMOL STORE - Global Frontend Configuration & Utilities

export const CONFIG = {
  API_BASE_URL: (window.location.port === '5000' || !window.location.port)
    ? '/api/v1'
    : `${window.location.protocol}//${window.location.hostname}:5000/api/v1`,
  APP_NAME: 'ANMOL STORE',
  TAGLINE_PRIMARY: 'Aapki Dukaan, Aapka Business, Aapki Pehchaan',
  TAGLINE_SECONDARY: 'LOCAL BUSINESS, DIGITAL FUTURE',
  CURRENCY_SYMBOL: '₹',
  DEFAULT_LOCATION: {
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    pincode: '208001'
  },
  STORAGE_KEYS: {
    AUTH_TOKEN: 'anmol_access_token',
    USER_DATA: 'anmol_user',
    USER_LOCATION: 'anmol_user_location',
    GUEST_CART: 'anmol_guest_cart',
    WISHLIST: 'anmol_guest_wishlist'
  }
};

/**
 * Format number to Indian Rupee currency format (e.g., ₹1,499.00 or ₹1,499)
 */
export function formatCurrency(amount, includeDecimals = false) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const num = Number(amount);
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0
  });
  return `${CONFIG.CURRENCY_SYMBOL}${formatted}`;
}

/**
 * Format ISO date string to user-friendly Indian format (e.g. 26 Oct 2026, 04:30 PM)
 */
export function formatDate(dateString, includeTime = false) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {})
  };
  return date.toLocaleDateString('en-IN', options);
}

/**
 * Fallback image provider for products, shops, services, and vehicles
 */
export function getFallbackImage(type = 'product') {
  const fallbacks = {
    product: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    shop: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    service: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
    vehicle: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
  };
  return fallbacks[type] || fallbacks.product;
}

/**
 * Debounce helper for inputs
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
