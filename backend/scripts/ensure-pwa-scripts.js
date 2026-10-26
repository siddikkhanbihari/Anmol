// Ensure PWA controller is loaded on every page
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '../../frontend');

const files = fs.readdirSync(frontendDir).filter(f => f.endsWith('.html'));
let count = 0;

for (const file of files) {
  const filePath = path.join(frontendDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const hasNavigation = content.includes('navigation.js');
  const hasPwa = content.includes('pwa.js');

  if (!hasNavigation && !hasPwa) {
    content = content.replace('</body>', '  <script type="module" src="js/pwa.js"></script>\n</body>');
    fs.writeFileSync(filePath, content, 'utf8');
    count++;
    console.log(`✓ Added pwa.js to ${file}`);
  }
}

console.log(`PWA script added to ${count} remaining pages.`);
