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
    area: 'Aroma Circle',
    city: 'Palanpur',
    state: 'Gujarat',
    pincode: '385001'
  },
  PALANPUR_AREAS: [
    { name: 'Aroma Circle', landmark: 'Major Highway Junction', icon: 'fa-map-pin' },
    { name: 'Highway Road (Deesa Highway)', landmark: 'Commercial Hub', icon: 'fa-road' },
    { name: 'Gathaman Gate (Gathaman Darwaja)', landmark: 'Old City Center', icon: 'fa-archway' },
    { name: 'Shimla Gate (Simla Darwaja)', landmark: 'Heritage Market', icon: 'fa-archway' },
    { name: 'Delhi Gate (Dilli Darwaja)', landmark: 'Wholesale Market', icon: 'fa-archway' },
    { name: 'Mira Gate (Meera Darwaja)', landmark: 'Central Town', icon: 'fa-archway' },
    { name: 'Railway Station Road', landmark: 'Station Area', icon: 'fa-train' },
    { name: 'Guru Nanak Chowk', landmark: 'Retail & Food Market', icon: 'fa-utensils' },
    { name: 'Joravar Palace / Rajgadhi Area', landmark: 'Palace Road', icon: 'fa-landmark' },
    { name: 'Cozy Area (Cozy Tower Road)', landmark: 'Shopping & Residential', icon: 'fa-building' },
    { name: 'Gobari Hill Area', landmark: 'High Elevation Zone', icon: 'fa-mountain' },
    { name: 'Abu Highway (Ahmedabad Bypass)', landmark: 'Auto & Transport Hub', icon: 'fa-truck' },
    { name: 'Kalyanpura / Subhash Chowk', landmark: 'Town Center', icon: 'fa-map-marker-alt' },
    { name: 'Shakti Nagar', landmark: 'Residential Society', icon: 'fa-home' },
    { name: 'Vidya Mandir School Area', landmark: 'Educational Zone', icon: 'fa-graduation-cap' },
    { name: 'Civil Hospital Road', landmark: 'Medical Hub', icon: 'fa-hospital' },
    { name: 'Man Sarovar Lake Area', landmark: 'Lake View', icon: 'fa-water' },
    { name: 'Surmandir Cinema Area', landmark: 'Entertainment Zone', icon: 'fa-film' },
    { name: 'Ganeshpura', landmark: 'Local Colony', icon: 'fa-home' },
    { name: 'Malan Darwaja', landmark: 'Historic Gate', icon: 'fa-archway' },
    { name: 'Taley Baug Area', landmark: 'Garden Area', icon: 'fa-tree' },
    { name: 'GIDC Palanpur', landmark: 'Industrial Estate', icon: 'fa-industry' },
    { name: 'Kanodar Road', landmark: 'South Palanpur', icon: 'fa-route' },
    { name: 'Rampura Road', landmark: 'Town Extension', icon: 'fa-map-signs' }
  ],
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
 * Resolve relative or absolute media URL safely
 */
export function resolveMediaUrl(url, type = 'product') {
  if (!url) return getFallbackImage(type);
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  if (window.location.port === '5000' || !window.location.port) {
    return cleanPath;
  }
  return `${window.location.protocol}//${window.location.hostname}:5000${cleanPath}`;
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
