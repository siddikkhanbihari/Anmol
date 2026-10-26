// Copy generated icons to Android Project
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcIcon = path.join(__dirname, '../../frontend/assets/icons/icon-192.png');
const srcIcon512 = path.join(__dirname, '../../frontend/assets/icons/icon-512.png');

const resDir = path.join(__dirname, '../../android/app/src/main/res');
const mipmapDirs = [
  'mipmap-mdpi',
  'mipmap-hdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi'
];

for (const dir of mipmapDirs) {
  const targetDir = path.join(resDir, dir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.copyFileSync(srcIcon, path.join(targetDir, 'ic_launcher.png'));
  fs.copyFileSync(srcIcon, path.join(targetDir, 'ic_launcher_round.png'));
  console.log(`✓ Copied icon to ${dir}`);
}

console.log('Android app launcher icons configured!');
