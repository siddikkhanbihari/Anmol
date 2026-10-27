// ANMOL STORE - Global Navigation, Location Selector & Layout Controller
import { auth } from './auth.js';
import { cart } from './cart.js';
import { CONFIG } from './config.js';
import { notify } from './notifications.js';
import { i18n } from './i18n.js';
import './pwa.js';
import './app-download-modal.js';

export class Navigation {
  static init() {
    this.initLocation();
    this.initLanguage();
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

  static initLanguage() {
    // 1. Language switcher mount in desktop announcement bar
    const announcementLinks = document.querySelector('.announcement-links');
    if (announcementLinks && !document.querySelector('.lang-switcher-announcement')) {
      const langWrap = document.createElement('span');
      langWrap.className = 'lang-switcher-announcement';
      langWrap.style.marginLeft = '12px';
      langWrap.style.display = 'inline-flex';
      langWrap.style.alignItems = 'center';
      announcementLinks.prepend(langWrap);
      i18n.renderSwitcher('.lang-switcher-announcement');
    }

    // 2. Language switcher mount in desktop header actions
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.querySelector('.header-lang-mount')) {
      const headerMount = document.createElement('div');
      headerMount.className = 'header-lang-mount';
      headerMount.style.display = 'flex';
      headerMount.style.alignItems = 'center';
      headerActions.prepend(headerMount);
      i18n.renderSwitcher('.header-lang-mount');
      headerMount.querySelectorAll('.btn-lang-toggle').forEach(btn => {
        btn.style.background = '#F1F5F9';
        btn.style.borderColor = 'var(--color-border)';
        btn.style.color = 'var(--primary-navy)';
      });
    }

    // 3. Mobile Drawer Language Switcher
    const mobileDrawer = document.querySelector('.mobile-drawer-overlay');
    if (mobileDrawer && !document.querySelector('.mobile-lang-box')) {
      const mobileBox = document.createElement('div');
      mobileBox.className = 'mobile-lang-box';
      mobileBox.style.padding = '12px 16px';
      mobileBox.style.borderBottom = '1px solid var(--color-border)';
      mobileBox.style.background = '#F8FAFC';
      mobileBox.innerHTML = `
        <div style="font-size: 0.72rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 6px;">
          🌐 Language / ભાષા / भाषा
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn btn-sm btn-outline mobile-lang-btn ${i18n.getLang() === 'gu' ? 'btn-primary' : ''}" data-lang="gu" style="flex: 1; padding: 6px 2px; font-size: 0.78rem;">
            🇮🇳 ગુજરાતી
          </button>
          <button type="button" class="btn btn-sm btn-outline mobile-lang-btn ${i18n.getLang() === 'hi' ? 'btn-primary' : ''}" data-lang="hi" style="flex: 1; padding: 6px 2px; font-size: 0.78rem;">
            🇮🇳 हिन्दी
          </button>
          <button type="button" class="btn btn-sm btn-outline mobile-lang-btn ${i18n.getLang() === 'en' ? 'btn-primary' : ''}" data-lang="en" style="flex: 1; padding: 6px 2px; font-size: 0.78rem;">
            🇬🇧 English
          </button>
        </div>
      `;
      const navList = mobileDrawer.querySelector('nav') || mobileDrawer.querySelector('.mobile-drawer-body') || mobileDrawer.querySelector('.mobile-drawer-inner');
      if (navList) {
        navList.prepend(mobileBox);
      } else {
        mobileDrawer.prepend(mobileBox);
      }

      mobileBox.querySelectorAll('.mobile-lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          i18n.setLang(btn.dataset.lang);
          mobileBox.querySelectorAll('.mobile-lang-btn').forEach(b => b.classList.remove('btn-primary'));
          btn.classList.add('btn-primary');
        });
      });
    }

    // 4. Translate page elements
    i18n.translatePage();

    // 5. Re-translate when dynamic content or language changes
    window.addEventListener('languageChanged', () => {
      this.updateLocationDisplays();
    });
  }

  static initLocation() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_LOCATION);
    this.currentLocation = saved ? JSON.parse(saved) : CONFIG.DEFAULT_LOCATION;
    // Ensure default is Palanpur 385001 if previously set to legacy Kanpur
    if (this.currentLocation.city === 'Kanpur') {
      this.currentLocation = CONFIG.DEFAULT_LOCATION;
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_LOCATION, JSON.stringify(this.currentLocation));
    }
    this.updateLocationDisplays();
  }

  static updateLocationDisplays() {
    const locElements = document.querySelectorAll('.current-location-display');
    const label = this.currentLocation.area
      ? `${this.currentLocation.area}, ${this.currentLocation.city || 'Palanpur'}`
      : `${this.currentLocation.city || 'Palanpur'}, ${this.currentLocation.pincode || '385001'}`;
    locElements.forEach(el => {
      el.textContent = label;
    });
  }

  static setLocation(city, state, pincode, area = '') {
    this.currentLocation = {
      area: area || (city === 'Palanpur' ? (this.currentLocation.area || 'Aroma Circle') : ''),
      city: city || 'Palanpur',
      state: state || 'Gujarat',
      pincode: pincode || '385001'
    };
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_LOCATION, JSON.stringify(this.currentLocation));
    this.updateLocationDisplays();
    const locName = this.currentLocation.area ? `${this.currentLocation.area}, ${this.currentLocation.city}` : this.currentLocation.city;
    notify.success(`Delivery location set to ${locName} (${this.currentLocation.pincode})`);
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

    const modalBody = modal.querySelector('.modal-body');
    const closeBtn = modal.querySelector('.modal-close');

    const renderPalanpurPicker = () => {
      if (!modalBody) return;

      const areas = CONFIG.PALANPUR_AREAS || [];
      const currentArea = this.currentLocation.area || 'Aroma Circle';

      modalBody.innerHTML = `
        <div class="palanpur-location-wrap">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); background: #EFF6FF; padding: 10px 14px; border-radius: var(--radius-lg); border: 1px solid #BFDBFE;">
            <div>
              <div style="font-weight: 700; color: var(--primary-navy); font-size: var(--font-size-sm);"><i class="fas fa-city" style="color: var(--brand-blue);"></i> Palanpur, Gujarat</div>
              <div style="font-size: 0.72rem; color: var(--color-muted);">District: Banaskantha &bull; PIN Code: <strong>385001</strong></div>
            </div>
            <span class="badge" style="background: #10B981; color: #FFF; font-size: 0.68rem; font-weight: 700;">Local Hub</span>
          </div>

          <div style="margin-bottom: var(--space-3); position: relative;">
            <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-muted); font-size: 0.85rem;"></i>
            <input type="text" id="palanpur-area-search" class="form-control" placeholder="Search area in Palanpur (Aroma Circle, Gathaman, Delhi Gate...)" style="padding-left: 36px; font-size: 0.85rem; height: 40px;" autocomplete="off">
          </div>

          <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary-navy); margin-bottom: 8px; display: flex; justify-content: space-between;">
            <span>CHOOSE DELIVERY LOCALITY / AREA:</span>
            <span style="color: var(--brand-blue);" id="area-count-label">${areas.length} Areas in Palanpur</span>
          </div>

          <div id="palanpur-areas-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; max-height: 260px; overflow-y: auto; padding: 2px;">
            ${renderAreaCards(areas, currentArea)}
          </div>

          <div style="margin-top: var(--space-4); border-top: 1px dashed var(--color-border); padding-top: var(--space-3); display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem;">
            <button type="button" id="btn-detect-location" class="btn btn-outline btn-sm" style="font-size: 0.72rem; padding: 4px 10px;">
              <i class="fas fa-location-arrow"></i> Use Current GPS
            </button>
            <button type="button" id="btn-toggle-custom-loc" style="background: none; border: none; color: var(--brand-blue); cursor: pointer; text-decoration: underline; font-size: 0.72rem;">
              Other City / Pincode
            </button>
          </div>

          <div id="custom-location-box" style="display: none; margin-top: var(--space-3); background: var(--color-bg); padding: var(--space-3); border-radius: var(--radius-md);">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>
                <label style="font-size: 0.7rem; font-weight: 600;">City</label>
                <input type="text" id="custom-city-input" class="form-control" value="Palanpur" style="font-size: 0.8rem; padding: 4px 8px;">
              </div>
              <div>
                <label style="font-size: 0.7rem; font-weight: 600;">PIN Code</label>
                <input type="text" id="custom-pin-input" class="form-control" value="385001" maxlength="6" style="font-size: 0.8rem; padding: 4px 8px;">
              </div>
            </div>
            <button type="button" id="btn-save-custom-loc" class="btn btn-primary btn-block btn-sm" style="margin-top: 8px;">Save Location</button>
          </div>
        </div>
      `;

      // Hide default save button in modal footer if present
      const modalFooter = modal.querySelector('.modal-footer');
      if (modalFooter) modalFooter.style.display = 'none';

      // Bind Area card clicks
      bindAreaCardClicks();

      // Bind search filter
      const searchInput = modal.querySelector('#palanpur-area-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.toLowerCase().trim();
          const filtered = areas.filter(a => a.name.toLowerCase().includes(query) || (a.landmark && a.landmark.toLowerCase().includes(query)));
          const grid = modal.querySelector('#palanpur-areas-grid');
          const countLabel = modal.querySelector('#area-count-label');
          if (grid) grid.innerHTML = renderAreaCards(filtered, this.currentLocation.area || 'Aroma Circle');
          if (countLabel) countLabel.textContent = `${filtered.length} Areas found`;
          bindAreaCardClicks();
        });
      }

      // Bind Custom location toggle
      const toggleCustom = modal.querySelector('#btn-toggle-custom-loc');
      const customBox = modal.querySelector('#custom-location-box');
      if (toggleCustom && customBox) {
        toggleCustom.addEventListener('click', () => {
          customBox.style.display = customBox.style.display === 'none' ? 'block' : 'none';
        });
      }

      // Bind Save Custom
      const saveCustomBtn = modal.querySelector('#btn-save-custom-loc');
      if (saveCustomBtn) {
        saveCustomBtn.addEventListener('click', () => {
          const cCity = modal.querySelector('#custom-city-input')?.value.trim() || 'Palanpur';
          const cPin = modal.querySelector('#custom-pin-input')?.value.trim() || '385001';
          this.setLocation(cCity, 'Gujarat', cPin);
          closeModal();
        });
      }

      // Bind GPS Detect
      const detectBtn = modal.querySelector('#btn-detect-location');
      if (detectBtn) {
        detectBtn.addEventListener('click', () => {
          if (!navigator.geolocation) {
            notify.error('Geolocation is not supported by your browser');
            return;
          }
          detectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
          navigator.geolocation.getCurrentPosition(
            () => {
              detectBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current GPS';
              this.setLocation('Palanpur', 'Gujarat', '385001', 'Aroma Circle');
              closeModal();
            },
            () => {
              detectBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current GPS';
              notify.warning('GPS permission denied. Palanpur location selected.');
              this.setLocation('Palanpur', 'Gujarat', '385001', 'Aroma Circle');
              closeModal();
            }
          );
        });
      }
    };

    function renderAreaCards(areaList, activeArea) {
      if (areaList.length === 0) {
        return '<div style="grid-column: span 2; text-align: center; padding: var(--space-4); color: var(--color-muted); font-size: var(--font-size-xs);">No matching Palanpur area found. Try another search.</div>';
      }

      return areaList.map(a => {
        const isSelected = a.name === activeArea;
        return `
          <div class="palanpur-area-card" data-area="${a.name}" style="background: ${isSelected ? '#EFF6FF' : '#FFF'}; border: 1.5px solid ${isSelected ? 'var(--brand-blue)' : 'var(--color-border)'}; border-radius: var(--radius-md); padding: 8px 10px; cursor: pointer; transition: all var(--transition-fast); display: flex; align-items: flex-start; gap: 8px;">
            <div style="width: 26px; height: 26px; border-radius: 50%; background: ${isSelected ? 'var(--brand-blue)' : '#F1F5F9'}; color: ${isSelected ? '#FFF' : 'var(--brand-blue)'}; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; flex-shrink: 0; margin-top: 1px;">
              <i class="fas ${a.icon || 'fa-map-pin'}"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.name}</div>
              <div style="font-size: 0.65rem; color: var(--color-muted);">${a.landmark || 'Palanpur 385001'}</div>
            </div>
            ${isSelected ? '<i class="fas fa-check-circle" style="color: var(--brand-blue); font-size: 0.85rem; margin-top: 4px;"></i>' : ''}
          </div>
        `;
      }).join('');
    }

    const bindAreaCardClicks = () => {
      modal.querySelectorAll('.palanpur-area-card').forEach(card => {
        card.addEventListener('click', () => {
          const areaName = card.dataset.area;
          this.setLocation('Palanpur', 'Gujarat', '385001', areaName);
          closeModal();
        });
      });
    };

    const openModal = () => {
      renderPalanpurPicker();
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
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Navigation.init();
});
