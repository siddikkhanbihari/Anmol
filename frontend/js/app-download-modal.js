// ANMOL STORE - App Download & QR Code Modal Controller
// Matches the visual style of enterprise login portals (like the user reference)

class AppDownloadController {
  constructor() {
    this.phoneUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : window.location.origin;

    this.init();
  }

  init() {
    this.injectModal();
    this.injectAuthFooters();
    this.bindEvents();
  }

  injectModal() {
    if (document.getElementById('app-download-modal')) return;

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(this.phoneUrl)}`;

    const modal = document.createElement('div');
    modal.id = 'app-download-modal';
    modal.className = 'app-modal-backdrop';
    modal.innerHTML = `
      <div class="app-modal-dialog">
        <div class="app-modal-header">
          <div class="app-modal-brand">
            <img src="/assets/icons/icon-192.png" alt="ANMOL STORE" class="app-modal-logo" />
            <div>
              <div class="app-modal-title">ANMOL STORE Mobile App</div>
              <div class="app-modal-subtitle">Local Business, Digital Future</div>
            </div>
          </div>
          <button type="button" class="app-modal-close" id="btn-close-app-modal" aria-label="Close">&times;</button>
        </div>

        <div class="app-modal-body">
          <div class="app-qr-container">
            <div class="app-qr-box">
              <img src="${qrImageUrl}" alt="Scan QR Code to open on Phone" class="app-qr-image" />
              <div class="app-qr-badge"><i class="fas fa-camera"></i> Scan with Phone</div>
            </div>
            <div class="app-qr-details">
              <h4>Scan to Open & Install</h4>
              <p>Point your mobile phone camera at this QR code to instantly launch ANMOL STORE on your phone.</p>
              
              <div class="app-url-pill">
                <i class="fas fa-link"></i>
                <span>${this.phoneUrl}</span>
              </div>

              <div class="app-features-list">
                <div><i class="fas fa-bolt"></i> <strong>Instant Loading:</strong> No waiting, smooth PWA engine</div>
                <div><i class="fas fa-shopping-bag"></i> <strong>Full Marketplace:</strong> Products, shops & bookings</div>
                <div><i class="fas fa-bell"></i> <strong>Order Tracking:</strong> Live status updates</div>
              </div>
            </div>
          </div>

          <div class="app-modal-divider">
            <span>OR DOWNLOAD DIRECTLY</span>
          </div>

          <div class="app-download-options">
            <a href="download-app.html" class="app-btn-download" id="modal-download-apk-btn">
              <div class="app-btn-icon"><i class="fab fa-android"></i></div>
              <div class="app-btn-text">
                <span class="app-btn-caption">Android Package</span>
                <span class="app-btn-label">Get Android App (.APK)</span>
              </div>
              <i class="fas fa-arrow-right app-btn-arrow"></i>
            </a>

            <button type="button" class="app-btn-pwa" id="modal-install-pwa-btn">
              <div class="app-btn-icon"><i class="fas fa-mobile-alt"></i></div>
              <div class="app-btn-text">
                <span class="app-btn-caption">Progressive Web App</span>
                <span class="app-btn-label">Install on Device</span>
              </div>
              <i class="fas fa-plus app-btn-arrow"></i>
            </button>
          </div>
        </div>

        <div class="app-modal-footer">
          <span class="status-indicator-dot online"></span>
          <span>ANMOL Cloud Connected &bull; v1.0.0 Production Ready</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  injectAuthFooters() {
    // If on auth pages (login, admin-login, register, seller-register), inject bottom toolbar like user's photo
    const authCard = document.querySelector('.auth-card') || document.querySelector('.login-box') || document.querySelector('form#login-form')?.parentElement;
    if (authCard && !document.getElementById('auth-app-toolbar')) {
      const toolbar = document.createElement('div');
      toolbar.id = 'auth-app-toolbar';
      toolbar.className = 'auth-card-app-bar';
      toolbar.innerHTML = `
        <div class="app-bar-status">
          <span class="status-indicator-dot online"></span>
          <span>ANMOL Cloud</span>
        </div>
        <div class="app-bar-actions">
          <button type="button" class="app-bar-btn" id="btn-show-qr">
            <i class="fas fa-qrcode"></i> QR Code
          </button>
          <a href="download-app.html" class="app-bar-btn" id="btn-direct-apk">
            <i class="fas fa-mobile-alt"></i> APK
          </a>
        </div>
      `;
      authCard.appendChild(toolbar);
    }

    // Also check announcement bar in header
    const announcementInner = document.querySelector('.announcement-inner');
    if (announcementInner && !document.getElementById('announcement-app-links')) {
      const linksWrap = document.createElement('div');
      linksWrap.id = 'announcement-app-links';
      linksWrap.className = 'announcement-app-links';
      linksWrap.innerHTML = `
        <button type="button" class="announcement-pill-btn" id="btn-announcement-qr">
          <i class="fas fa-qrcode"></i> QR Code
        </button>
        <a href="download-app.html" class="announcement-pill-btn">
          <i class="fas fa-mobile-alt"></i> APK
        </a>
      `;
      announcementInner.appendChild(linksWrap);
    }
  }

  bindEvents() {
    // Close modal
    document.getElementById('btn-close-app-modal')?.addEventListener('click', () => {
      this.closeModal();
    });

    // Close on backdrop click
    document.getElementById('app-download-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'app-download-modal') {
        this.closeModal();
      }
    });

    // Delegate open modal buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-show-qr') || e.target.closest('#btn-announcement-qr') || e.target.closest('.trigger-app-modal')) {
        e.preventDefault();
        this.openModal();
      }
    });

    // Modal PWA install button
    document.getElementById('modal-install-pwa-btn')?.addEventListener('click', () => {
      if (window.installAnmolApp) {
        window.installAnmolApp();
      } else {
        alert('To install the app, tap your browser menu (⋮) and select "Install App" or "Add to Home Screen".');
      }
    });
  }

  openModal() {
    const modal = document.getElementById('app-download-modal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeModal() {
    const modal = document.getElementById('app-download-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }
}

// Global auto-init
export const appDownloadController = new AppDownloadController();
