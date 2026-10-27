// ANMOL STORE - Global Navigation, Location Selector & Layout Controller
import { auth } from './auth.js';
import { cart } from './cart.js';
import { CONFIG } from './config.js';
import { notify } from './notifications.js';
import './pwa.js';
import './app-download-modal.js';

export class Navigation {
  static init() {
    this.initLocation();
    this.updateUserNav();
    this.bindSearchForms();
    this.bindMobileDrawer();
    this.bindLocationModal();

    // Listen for auth changes
    auth.subscribe(() => {
      this.updateUserNav();
    });

    // Listen for cart changes
    cart.subscribe(() => {
      cart.updateBadges();
    });

    cart.fetchCart();
  }

  static initLocation() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_LOCATION);
    this.currentLocation = saved ? JSON.parse(saved) : CONFIG.DEFAULT_LOCATION;
    this.updateLocationDisplays();
  }

  static updateLocationDisplays() {
    const locElements = document.querySelectorAll('.current-location-display');
    locElements.forEach(el => {
      el.textContent = `${this.currentLocation.city}, ${this.currentLocation.pincode}`;
    });
  }

  static setLocation(city, state, pincode) {
    this.currentLocation = { city, state: state || 'Uttar Pradesh', pincode };
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_LOCATION, JSON.stringify(this.currentLocation));
    this.updateLocationDisplays();
    notify.success(`Location set to ${city} (${pincode})`);
    // Dispatch custom event for pages that want to reload based on location
    window.dispatchEvent(new CustomEvent('locationChanged', { detail: this.currentLocation }));
  }

  static updateUserNav() {
    const user = auth.getUser();
    const accountLinks = document.querySelectorAll('.user-account-link');
    const authActionBtn = document.querySelectorAll('.auth-action-btn');

    accountLinks.forEach(link => {
      if (user) {
        let targetHref = '/customer-dashboard.html';
        let roleLabel = 'My Account';
        if (user.role === 'seller') {
          targetHref = '/seller-dashboard.html';
          roleLabel = 'Seller Hub';
        } else if (user.role === 'admin') {
          targetHref = '/admin-dashboard.html';
          roleLabel = 'Admin Panel';
        } else if (user.role === 'rider') {
          targetHref = '/rider-dashboard.html';
          roleLabel = 'Rider Hub';
        }

        link.href = targetHref;
        const textSpan = link.querySelector('.header-action-text');
        if (textSpan) {
          textSpan.textContent = user.name ? user.name.split(' ')[0] : roleLabel;
        }
      } else {
        link.href = '/login.html';
        const textSpan = link.querySelector('.header-action-text');
        if (textSpan) {
          textSpan.textContent = 'Sign In';
        }
      }
    });
  }

  static bindSearchForms() {
    const searchForms = document.querySelectorAll('.header-search-form');
    searchForms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="search"], input[type="text"]');
        const query = input ? input.value.trim() : '';
        if (query) {
          window.location.href = `/products.html?q=${encodeURIComponent(query)}`;
        }
      });
    });
  }

  static bindMobileDrawer() {
    const toggleBtns = document.querySelectorAll('.mobile-menu-toggle');
    const overlay = document.querySelector('.mobile-drawer-overlay');
    const closeBtn = document.querySelector('.mobile-drawer-close');

    if (!overlay) return;

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    const closeDrawer = () => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDrawer();
    });
  }

  static bindLocationModal() {
    const openBtns = document.querySelectorAll('.location-picker-btn');
    const modal = document.getElementById('location-modal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close');
    const saveBtn = modal.querySelector('#btn-save-location');
    const detectBtn = modal.querySelector('#btn-detect-location');
    const cityInput = modal.querySelector('#location-city-input');
    const pincodeInput = modal.querySelector('#location-pincode-input');

    const openModal = () => {
      if (cityInput) cityInput.value = this.currentLocation.city;
      if (pincodeInput) pincodeInput.value = this.currentLocation.pincode;
      modal.classList.add('active');
    };

    const closeModal = () => {
      modal.classList.remove('active');
    };

    openBtns.forEach(btn => btn.addEventListener('click', openModal));
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const city = cityInput.value.trim() || 'Kanpur';
        const pincode = pincodeInput.value.trim() || '208001';
        this.setLocation(city, 'Uttar Pradesh', pincode);
        closeModal();
      });
    }

    if (detectBtn) {
      detectBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
          notify.error('Geolocation is not supported by your browser');
          return;
        }
        detectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
        navigator.geolocation.getCurrentPosition(
          (position) => {
            detectBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
            // In a production setup, reverse-geocode with API. For now, detect local area
            this.setLocation('Kanpur Civil Lines', 'Uttar Pradesh', '208001');
            closeModal();
          },
          (err) => {
            detectBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
            notify.warning('Could not get GPS permission. Please enter city or PIN code manually.');
          }
        );
      });
    }
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Navigation.init();
});
