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
    REFRESH_TOKEN: 'anmol_refresh_token',
    USER_DATA: 'anmol_user',
    USER_LOCATION: 'anmol_user_location',
    GUEST_CART: 'anmol_guest_cart',
    WISHLIST: 'anmol_guest_wishlist'
  },
  UPI_PAYMENT: {
    merchantName: 'ARMAN MAHAMADARIFBHAI PIPRANI',
    storeName: 'ANMOL STORE',
    merchantPhone: '+91 6351111457',
    qrImageUrl: 'assets/images/merchant-qr.jpg',
    backupQrUrl: '/uploads/merchant-qr.jpg'
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

export const FALLBACK_PLACEHOLDER_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300' fill='%23F1F5F9'%3E%3Crect width='400' height='300'/%3E%3Ccircle cx='130' cy='110' r='28' fill='%23CBD5E1'/%3E%3Cpath d='M70 230l80-90 60 60 50-65 70 95z' fill='%23CBD5E1'/%3E%3Ctext x='200' y='270' font-family='sans-serif' font-size='15' font-weight='700' fill='%2394A3B8' text-anchor='middle'%3EANMOL STORE%3C/text%3E%3C/svg%3E";

/**
 * Resolve relative or absolute media URL safely
 */
export function resolveMediaUrl(url, type = 'product') {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return getFallbackImage(type);
  }
  const clean = url.trim();
  if (clean.startsWith('data:') || clean.startsWith('blob:') || clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  return clean.startsWith('/') ? clean : `/${clean}`;
}

/**
 * Fallback image provider for products, shops, services, and vehicles
 * Returns high-availability self-contained vector placeholder that never fails
 */
export function getFallbackImage(type = 'product') {
  return FALLBACK_PLACEHOLDER_SVG;
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


/**
 * Generate reusable HTML for Doorstep UPI QR display
 */
export function getDoorstepQrHtml(amount = null) {
  const amountHtml = amount ? `
    <div style="font-size: 1.15rem; font-weight: 800; color: #581C87; margin: 4px 0 8px 0;">
      Amount Payable: <span style="color: #9333EA;">${formatCurrency(amount)}</span>
    </div>
  ` : '';

  return `
    <div class="doorstep-qr-container">
      <div class="doorstep-qr-header">
        <span class="doorstep-qr-badge"><i class="fas fa-qrcode"></i> PhonePe & UPI QR</span>
        <span>Doorstep Payment Accepted</span>
      </div>
      <p style="font-size: 0.78rem; color: #6B21A8; margin: 4px auto 8px auto; max-width: 440px; line-height: 1.4;">
        Delivery aane par aap cash de sakte hain ya niche diye gaye QR code ko kisi bhi UPI app se scan karke pay kar sakte hain.
      </p>
      ${amountHtml}
      <div class="doorstep-qr-box">
        <img src="assets/images/merchant-qr.jpg" alt="ANMOL STORE PhonePe QR" class="doorstep-qr-img" onerror="this.onerror=null; this.src='/uploads/merchant-qr.jpg';">
      </div>
      <div class="doorstep-merchant-name">ARMAN MAHAMADARIFBHAI PIPRANI</div>
      <div class="doorstep-merchant-sub">ANMOL STORE Verified PhonePe Merchant Standee</div>
      <div class="doorstep-app-pills">
        <span class="doorstep-app-pill"><i class="fas fa-mobile-alt" style="color: #5F259F;"></i> PhonePe</span>
        <span class="doorstep-app-pill"><i class="fab fa-google-pay" style="color: #EA4335;"></i> Google Pay</span>
        <span class="doorstep-app-pill"><i class="fas fa-wallet" style="color: #00BAF2;"></i> Paytm</span>
        <span class="doorstep-app-pill"><i class="fas fa-university" style="color: #10B981;"></i> Any UPI App</span>
      </div>
    </div>
  `;
}
