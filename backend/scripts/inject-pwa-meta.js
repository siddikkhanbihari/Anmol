// ANMOL STORE - Script to inject PWA & Mobile App metadata into all HTML heads
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '../../frontend');

const pwaMetaBlock = `  <meta name="theme-color" content="#123B70">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="ANMOL STORE">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/svg+xml" href="/assets/icons/icon.svg">
  <link rel="apple-touch-icon" href="/assets/icons/icon-192.png">`;

const files = fs.readdirSync(frontendDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;
for (const file of files) {
  const filePath = path.join(frontendDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('rel="manifest"')) {
    // Insert right after viewport meta tag
    content = content.replace(
      /(<meta\s+name=["']viewport["'][^>]*>)/i,
      `$1\n${pwaMetaBlock}`
    );
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`✓ Updated PWA metadata in ${file}`);
  }
}

console.log(`PWA metadata successfully verified and updated in ${updatedCount} files.`);
