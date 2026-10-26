// Create downloadable APK package in frontend/downloads
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const downloadsDir = path.join(__dirname, '../../frontend/downloads');

if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Write an info README as well
fs.writeFileSync(
  path.join(downloadsDir, 'INSTALL_INSTRUCTIONS.txt'),
  `ANMOL STORE — Official Android App
Package ID: in.anmolstore.app
Version: 1.0.0

To build the APK locally using Android Studio:
1. Open Android Studio
2. Click "Open" -> select the 'android' folder in your ANMOL project:
   C:\\Users\\HP\\Desktop\\anmol\\android
3. Click "Build" -> "Build Bundle(s) / APK(s)" -> "Build APK(s)"
4. The generated APK will be in:
   android/app/build/outputs/apk/debug/app-debug.apk

To generate APK instantly via PWABuilder (Cloud 1-Click):
1. Visit https://www.pwabuilder.com
2. Enter your live URL: https://anmolstore.in
3. Click "Package for Stores" -> "Android"
4. Download the signed ready-to-use APK!
`
);

console.log('✓ Created frontend/downloads directory and instructions.');
