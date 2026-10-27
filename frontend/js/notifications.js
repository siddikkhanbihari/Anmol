// ANMOL STORE - Toast Notification Manager

class NotificationManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show({ title, message, type = 'info', duration = 4000 }) {
    if (!this.container) this.init();

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas ${icons[type] || icons.info}"></i>
      </div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      setTimeout(() => toast.remove(), 200);
    };

    closeBtn.addEventListener('click', dismiss);

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }

  success(message, title = 'Success') {
    this.show({ title, message, type: 'success' });
  }

  error(message, title = 'Error') {
    this.show({ title, message, type: 'error', duration: 5000 });
  }

  warning(message, title = 'Warning') {
    this.show({ title, message, type: 'warning' });
  }

  info(message, title = 'Information') {
    this.show({ title, message, type: 'info' });
  }

  // Synthesize standard Web Audio chime without needing external mp3 files
  playOrderSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Two-tone pleasant doorbell chime (D5 -> G5)
      playTone(587.33, 0, 0.25);
      playTone(783.99, 0.22, 0.45);
    } catch (e) {
      // Audio autoplay restriction fallback
    }
  }

  // High urgency double chime for rider delivery alerts
  playRiderAlert() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.22, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Triple urgency fleet chime (E5 -> A5 -> E6)
      playTone(659.25, 0, 0.12);
      playTone(880.00, 0.14, 0.14);
      playTone(1318.51, 0.30, 0.35);
    } catch (e) {
      // Autoplay fallback
    }
  }

  playSuccessSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Upbeat victory chime (C5 -> E5 -> G5 -> C6)
      playTone(523.25, 0, 0.10);
      playTone(659.25, 0.09, 0.10);
      playTone(783.99, 0.18, 0.12);
      playTone(1046.50, 0.28, 0.35);
    } catch (e) {
      // Autoplay fallback
    }
  }

  requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  showDesktopNotification(title, body, url = null) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/assets/icons/icon-192.png',
          badge: '/assets/icons/icon-192.png'
        });
        if (url) {
          notif.onclick = () => {
            window.focus();
            window.location.href = url;
          };
        }
      } catch (e) {
        // Mobile fallback
      }
    }
  }
}

export const notify = new NotificationManager();
