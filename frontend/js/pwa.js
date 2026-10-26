// ANMOL STORE - Progressive Web App (PWA) Controller & Installation Manager
import './app-download-modal.js';

class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    this.init();
  }

  init() {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[ANMOL PWA] Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[ANMOL PWA] Service Worker registration failed:', err);
          });
      });
    }

    // If already running inside standalone app, do not show install banner
    if (this.isStandalone) {
      console.log('[ANMOL PWA] Running in standalone Native App mode');
      document.body.classList.add('is-standalone-app');
      return;
    }

    // 2. Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent mini-infobar on mobile Chrome
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('[ANMOL PWA] Application ready for installation');

      // Show the install UI after a small delay (2.5s) so the user sees the page first
      setTimeout(() => {
        this.renderInstallBanner();
      }, 2500);
    });

    // 3. Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('[ANMOL PWA] ANMOL STORE was successfully installed!');
      this.deferredPrompt = null;
      this.hideInstallBanner();
    });
  }

  renderInstallBanner() {
    // If banner already exists or user dismissed it in this session
    if (document.getElementById('pwa-install-banner') || sessionStorage.getItem('anmol_pwa_dismissed')) {
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-banner';
    banner.innerHTML = `
      <div class="pwa-banner-content">
        <img src="/assets/icons/icon-192.png" alt="ANMOL STORE" class="pwa-banner-icon" />
        <div class="pwa-banner-text">
          <div class="pwa-banner-title">Install ANMOL STORE App</div>
          <div class="pwa-banner-desc">Fast, secure local shopping right from your home screen!</div>
        </div>
      </div>
      <div class="pwa-banner-actions">
        <button id="pwa-install-btn" class="pwa-btn pwa-btn-primary">
          <i class="fas fa-download"></i> Install App
        </button>
        <button id="pwa-dismiss-btn" class="pwa-btn pwa-btn-dismiss" aria-label="Dismiss">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    // Event listeners
    document.getElementById('pwa-install-btn')?.addEventListener('click', () => {
      this.promptInstall();
    });

    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallBanner();
      sessionStorage.setItem('anmol_pwa_dismissed', 'true');
    });
  }

  hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.add('pwa-banner-closing');
      setTimeout(() => banner.remove(), 300);
    }
  }

  async promptInstall() {
    if (!this.deferredPrompt) {
      // If native prompt not available (e.g. iOS Safari)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        alert('To install ANMOL STORE on iPhone:\n1. Tap the Share button in Safari (box with arrow)\n2. Select "Add to Home Screen" 📲');
      } else {
        alert('Tap your browser menu (⋮) and select "Install app" or "Add to Home Screen" to install ANMOL STORE.');
      }
      return;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`[ANMOL PWA] User response to install prompt: ${outcome}`);
    this.deferredPrompt = null;
    this.hideInstallBanner();
  }
}

// Global instance
export const pwa = new PWAManager();
window.installAnmolApp = () => pwa.promptInstall();
