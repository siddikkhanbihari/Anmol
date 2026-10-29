// ANMOL STORE — Blinkit-Inspired Quick-Commerce Engine
import { api } from './api.js';
import { cart } from './cart.js';
import { auth } from './auth.js';
import { formatCurrency, resolveMediaUrl, FALLBACK_PLACEHOLDER_SVG } from './config.js';
import { notify } from './notifications.js';

export class QuickCommerce {
  static init() {
    this.initLocationModal();
    this.initSearchPlaceholderCycle();
    this.initFloatingCartBar();
    this.renderBlinkitShelves();

    // Re-render button states whenever cart items change
    cart.subscribe(() => {
      this.syncCardButtonsWithCart();
      this.updateFloatingCartBar();
    });
  }

  // 1. Search Placeholder Animation Cycle
  static initSearchPlaceholderCycle() {
    const searchInput = document.getElementById('qc-main-search-input');
    if (!searchInput) return;

    const placeholders = [
      'Search "Atta, Rice & Dal"...',
      'Search "Tata Tea & Sunflower Oil"...',
      'Search "boAt Earphones & Chargers"...',
      'Search "Electricians & Mechanics"...',
      'Search "Sharma Kirana Store"...'
    ];

    let index = 0;
    setInterval(() => {
      if (document.activeElement !== searchInput) {
        index = (index + 1) % placeholders.length;
        searchInput.placeholder = placeholders[index];
      }
    }, 3200);
  }

  // 2. Location Modal & Locality Switcher
  static initLocationModal() {
    const trigger = document.getElementById('qc-location-widget');
    const modal = document.getElementById('qc-location-modal');
    const closeBtn = document.getElementById('qc-location-close');
    const areaChips = document.querySelectorAll('.qc-area-chip');
    const gpsBtn = document.getElementById('qc-btn-detect-gps');
    const displayArea = document.getElementById('qc-display-area');
    const displayPincode = document.getElementById('qc-display-pincode');

    if (!modal) return;

    const savedLoc = localStorage.getItem('anmol_user_location');
    if (savedLoc) {
      try {
        const parsed = JSON.parse(savedLoc);
        if (displayArea && parsed.area) displayArea.textContent = parsed.area;
        if (displayPincode && parsed.pincode) displayPincode.textContent = parsed.pincode;
      } catch (e) {}
    }

    trigger?.addEventListener('click', () => {
      modal.classList.add('active');
    });

    closeBtn?.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });

    areaChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const areaName = chip.dataset.area || chip.textContent.trim();
        const pincode = chip.dataset.pincode || '385001';
        
        areaChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        if (displayArea) displayArea.textContent = areaName;
        if (displayPincode) displayPincode.textContent = pincode;

        const locData = { city: 'Palanpur', state: 'Gujarat', area: areaName, pincode };
        localStorage.setItem('anmol_user_location', JSON.stringify(locData));
        notify.success(`Delivery address set to ${areaName}, Palanpur (${pincode})`);

        setTimeout(() => modal.classList.remove('active'), 200);
      });
    });

    gpsBtn?.addEventListener('click', () => {
      if (navigator.geolocation) {
        gpsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting location...';
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            gpsBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use My Current Location (GPS)';
            const locData = { city: 'Palanpur', state: 'Gujarat', area: 'Station Road', pincode: '385001', coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } };
            localStorage.setItem('anmol_user_location', JSON.stringify(locData));
            if (displayArea) displayArea.textContent = 'Detected Area';
            notify.success('✓ Current GPS location updated for instant delivery!');
            modal.classList.remove('active');
          },
          (err) => {
            gpsBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use My Current Location (GPS)';
            notify.info('Location detected as Palanpur Central (385001)');
            modal.classList.remove('active');
          },
          { timeout: 6000 }
        );
      }
    });
  }

  // 3. Floating Quick-Commerce Bottom Cart Bar
  static initFloatingCartBar() {
    this.updateFloatingCartBar();
  }

  static updateFloatingCartBar() {
    const bar = document.getElementById('qc-floating-cart-bar');
    if (!bar) return;

    const count = cart.getItemCount();
    if (count > 0) {
      const items = cart.cart?.items || [];
      const subtotal = items.reduce((sum, item) => {
        const price = item.product?.price || item.priceSnapshot || 0;
        return sum + (price * (item.quantity || 1));
      }, 0);

      const itemsText = bar.querySelector('.qc-float-items');
      const totalText = bar.querySelector('.qc-float-total');

      if (itemsText) itemsText.textContent = `${count} ${count === 1 ? 'ITEM' : 'ITEMS'}`;
      if (totalText) totalText.textContent = formatCurrency(subtotal);

      bar.classList.add('active');
    } else {
      bar.classList.remove('active');
    }
  }

  // 4. Build Blinkit Product Card HTML with Interactive In-Place Counter
  static renderProductCard(p) {
    const hasDiscount = p.originalPrice && p.originalPrice > p.price;
    const discountPercent = hasDiscount
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : null;

    // Determine unit / pack size
    let unitLabel = p.unit || '1 pack';
    if (p.name.includes('5 kg') || p.name.includes('5kg')) unitLabel = '5 kg';
    else if (p.name.includes('1 kg') || p.name.includes('1kg')) unitLabel = '1 kg';
    else if (p.name.includes('500g') || p.name.includes('500 g')) unitLabel = '500 g';
    else if (p.name.includes('1 Litre') || p.name.includes('1L')) unitLabel = '1 Litre';
    else if (p.name.includes('Neckband') || p.name.includes('Watch')) unitLabel = '1 piece';

    const cartItem = (cart.cart?.items || []).find(
      i => (i.product?._id || i.product?.id || i.productId) === p._id
    );
    const inCartQty = cartItem ? cartItem.quantity : 0;

    const actionButtonHtml = inCartQty > 0
      ? `
        <div class="blinkit-qty-counter" data-id="${p._id}">
          <button type="button" class="blinkit-qty-btn btn-qc-dec" data-id="${p._id}" aria-label="Decrease quantity">−</button>
          <span class="blinkit-qty-value">${inCartQty}</span>
          <button type="button" class="blinkit-qty-btn btn-qc-inc" data-id="${p._id}" aria-label="Increase quantity">+</button>
        </div>
      `
      : `
        <button type="button" class="blinkit-add-btn btn-qc-add" data-id="${p._id}" data-product='${JSON.stringify({ _id: p._id, name: p.name, price: p.price, shop: p.shop, stock: p.stock })}'>
          ADD <i class="fas fa-plus" style="font-size: 0.72rem;"></i>
        </button>
      `;

    return `
      <div class="qc-card" data-product-id="${p._id}">
        <div class="qc-card-thumb-wrap">
          <span class="qc-time-tag"><i class="fas fa-bolt"></i> 12 MINS</span>
          ${hasDiscount ? `<span class="qc-discount-tag">${discountPercent}% OFF</span>` : ''}
          <a href="product-details.html?id=${p._id}" style="display: contents;">
            <img class="qc-card-img" src="${resolveMediaUrl(p.images?.[0], 'product')}" alt="${p.name}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='${FALLBACK_PLACEHOLDER_SVG}';">
          </a>
        </div>
        <div class="qc-card-content">
          <a href="shop-details.html?slug=${p.shop?.slug || ''}" class="qc-card-shop">
            <i class="fas fa-store" style="font-size: 0.65rem;"></i> ${p.shop?.name || 'Local Seller'}
          </a>
          <a href="product-details.html?id=${p._id}" class="qc-card-name" title="${p.name}">
            ${p.name}
          </a>
          <div class="qc-card-unit">${unitLabel}</div>
          <div class="qc-card-action-row">
            <div class="qc-price-block">
              <span class="qc-price-current">${formatCurrency(p.price)}</span>
              ${hasDiscount ? `<span class="qc-price-original">${formatCurrency(p.originalPrice)}</span>` : ''}
            </div>
            <div class="qc-btn-container" id="qc-btn-wrap-${p._id}">
              ${actionButtonHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 5. Sync Card Buttons with Cart (Instant without page reload)
  static syncCardButtonsWithCart() {
    const items = cart.cart?.items || [];
    const itemMap = new Map();
    items.forEach(i => {
      const pid = (i.product?._id || i.product?.id || i.productId);
      if (pid) itemMap.set(pid.toString(), i.quantity);
    });

    document.querySelectorAll('.qc-card').forEach(card => {
      const pId = card.dataset.productId;
      if (!pId) return;

      const btnWrap = document.getElementById(`qc-btn-wrap-${pId}`);
      if (!btnWrap) return;

      const qty = itemMap.get(pId) || 0;
      if (qty > 0) {
        btnWrap.innerHTML = `
          <div class="blinkit-qty-counter" data-id="${pId}">
            <button type="button" class="blinkit-qty-btn btn-qc-dec" data-id="${pId}" aria-label="Decrease quantity">−</button>
            <span class="blinkit-qty-value">${qty}</span>
            <button type="button" class="blinkit-qty-btn btn-qc-inc" data-id="${pId}" aria-label="Increase quantity">+</button>
          </div>
        `;
      } else {
        const prodData = btnWrap.dataset.productCache;
        btnWrap.innerHTML = `
          <button type="button" class="blinkit-add-btn btn-qc-add" data-id="${pId}" ${prodData ? `data-product='${prodData}'` : ''}>
            ADD <i class="fas fa-plus" style="font-size: 0.72rem;"></i>
          </button>
        `;
      }
    });

    this.bindCardEvents();
  }

  // 6. Bind Add / Stepper Events
  static bindCardEvents() {
    // Add Click
    document.querySelectorAll('.btn-qc-add').forEach(btn => {
      // Prevent duplicate event handlers
      if (btn.dataset.bound) return;
      btn.dataset.bound = 'true';

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const pId = btn.dataset.id;
        const raw = btn.dataset.product;
        if (!raw) return;

        const product = JSON.parse(raw);
        // Cache product JSON on container for re-rendering
        const container = document.getElementById(`qc-btn-wrap-${pId}`);
        if (container) container.dataset.productCache = raw;

        btn.disabled = true;
        await cart.addItem(product, 1);
        notify.playSuccessSound();
      });
    });

    // Plus Click
    document.querySelectorAll('.btn-qc-inc').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = 'true';

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const pId = btn.dataset.id;
        const cartItem = (cart.cart?.items || []).find(
          i => (i.product?._id || i.product?.id || i.productId) === pId
        );
        if (cartItem) {
          const nextQty = (cartItem.quantity || 1) + 1;
          await cart.updateQuantity(cartItem._id, nextQty);
        }
      });
    });

    // Minus Click
    document.querySelectorAll('.btn-qc-dec').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = 'true';

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const pId = btn.dataset.id;
        const cartItem = (cart.cart?.items || []).find(
          i => (i.product?._id || i.product?.id || i.productId) === pId
        );
        if (cartItem) {
          const nextQty = (cartItem.quantity || 1) - 1;
          if (nextQty <= 0) {
            await cart.removeItem(cartItem._id);
          } else {
            await cart.updateQuantity(cartItem._id, nextQty);
          }
        }
      });
    });
  }

  // 7. Render Blinkit Quick-Commerce Product Shelves
  static async renderBlinkitShelves() {
    try {
      const res = await api.get('/products?limit=24');
      if (!res.success || !res.data?.products) return;

      const all = res.data.products;

      // Group products into shelves
      const grocery = all.filter(p => {
        const name = p.name.toLowerCase();
        return name.includes('atta') || name.includes('tea') || name.includes('oil') || name.includes('rice') || name.includes('dal');
      });

      const electronics = all.filter(p => {
        const name = p.name.toLowerCase();
        return name.includes('boat') || name.includes('power bank') || name.includes('watch') || name.includes('neckband');
      });

      const hardware = all.filter(p => {
        const name = p.name.toLowerCase();
        return name.includes('drill') || name.includes('switch') || name.includes('motul') || name.includes('engine');
      });

      // Trending = Highest reviewed or discounted items
      const trending = [...all].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)).slice(0, 5);

      // Shelf 1: Daily Grocery & Kitchen Essentials
      const shelfGrocery = document.getElementById('qc-shelf-grocery');
      if (shelfGrocery) {
        shelfGrocery.innerHTML = (grocery.length ? grocery : all.slice(0, 5))
          .map(p => this.renderProductCard(p)).join('');
      }

      // Shelf 2: Trending & Best Sellers
      const shelfTrending = document.getElementById('qc-shelf-trending');
      if (shelfTrending) {
        shelfTrending.innerHTML = trending.map(p => this.renderProductCard(p)).join('');
      }

      // Shelf 3: Electronics & Mobile Accessories
      const shelfElectronics = document.getElementById('qc-shelf-electronics');
      if (shelfElectronics) {
        shelfElectronics.innerHTML = (electronics.length ? electronics : all.slice(4, 9))
          .map(p => this.renderProductCard(p)).join('');
      }

      // Shelf 4: Hardware & Auto Care
      const shelfHardware = document.getElementById('qc-shelf-hardware');
      if (shelfHardware) {
        shelfHardware.innerHTML = (hardware.length ? hardware : all.slice(2, 7))
          .map(p => this.renderProductCard(p)).join('');
      }

      this.bindCardEvents();
    } catch (err) {
      console.error('Blinkit shelves render error:', err);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => QuickCommerce.init());
} else {
  QuickCommerce.init();
}
