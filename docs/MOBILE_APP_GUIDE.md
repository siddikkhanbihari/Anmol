# ANMOL STORE — Mobile App (Android APK & PWA) Guide

This guide details how **ANMOL STORE** is converted into a mobile application.

---

## 1. Ready-to-Use Progressive Web App (PWA)

ANMOL STORE is now fully equipped as a **PWA**:
- **Manifest**: Located at `frontend/manifest.json`.
- **Service Worker**: Located at `frontend/sw.js` with offline caching, fast asset loading, and network-first API requests.
- **Brand App Icons**: Located at `frontend/assets/icons/` (192x192, 512x512, SVG, and Android maskable icons).
- **Auto-Install Prompt**: Smart floating "Install App" banner on mobile devices and desktop.

### How Customers & Sellers Install the App (Android / iOS):
1. Open `https://anmolstore.in` in Chrome on Android.
2. A banner appears: **"Install ANMOL STORE App"** -> Tap **"Install App"**.
3. The app is installed directly to the phone's App Drawer and Home Screen with the official icon.
4. When opened, it runs in **standalone mode** (no browser address bar, full-screen native app feel).
5. On iPhone (iOS): Tap the **Share** button in Safari -> Tap **"Add to Home Screen"**.

---

## 2. Generate Installable Android APK / Play Store AAB (1-Click Free)

Once your website is live at `https://anmolstore.in`:

1. Open **[PWABuilder.com](https://www.pwabuilder.com)** (Official tool by Microsoft).
2. Enter your URL: `https://anmolstore.in` and click **"Start"**.
3. All PWA checks will show **Green / 100% Passed** (Manifest, Service Worker, Icons are already configured).
4. Click **"Package for Stores"** -> Select **"Android"**.
5. PWABuilder generates:
   - **`app-release.apk`**: Install directly on any Android phone (via WhatsApp / Drive / direct download).
   - **`app-release-bundle.aab`**: Ready for upload to the **Google Play Console** for publishing to the Play Store!

---

## 3. Native Android Build with Capacitor & Android Studio

If you prefer compiling your own Android APK from source code:

### Prerequisites:
- Node.js 18+
- Android Studio installed

### Steps:
```bash
# 1. Install Capacitor dependencies
npm install @capacitor/core @capacitor/cli @capacitor/android --save-dev

# 2. Add Android platform
npx cap add android

# 3. Copy frontend assets
npx cap copy

# 4. Open in Android Studio
npx cap open android
```

In Android Studio:
- Click **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
- Locate the `.apk` in `android/app/build/outputs/apk/debug/app-debug.apk`.
