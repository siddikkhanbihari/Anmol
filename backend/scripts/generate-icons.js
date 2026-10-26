// ANMOL STORE - High Quality PNG App Icon Generator (Pure Node.js + zlib)
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '../../frontend/assets/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generateAnmolIconPng(size, isMaskable = false) {
  // Brand colors:
  // Navy: #123B70 -> (18, 59, 112)
  // Orange: #F97316 -> (249, 115, 22)
  // White: #FFFFFF -> (255, 255, 255)
  // Blue accent: #2563EB -> (37, 99, 235)

  const width = size;
  const height = size;
  const rawData = Buffer.alloc((width * 4 + 1) * height);

  const radius = isMaskable ? 0 : size * 0.22; // rounded squircle if not maskable
  const center = size / 2;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      // Calculate distance from rounded box corners
      let inBox = true;
      if (!isMaskable) {
        const dx = Math.max(0, Math.abs(x - center) - (center - radius));
        const dy = Math.max(0, Math.abs(y - center) - (center - radius));
        if (dx * dx + dy * dy > radius * radius) {
          inBox = false;
        }
      }

      if (!inBox) {
        // Transparent
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        continue;
      }

      // Inside icon boundary
      const nx = (x - center) / (size * 0.4); // normalized -1 to 1 around content
      const ny = (y - center) / (size * 0.4);

      // Background gradient (Navy to Brand Blue)
      const gradT = y / height;
      let r = Math.round(18 * (1 - gradT) + 30 * gradT);
      let g = Math.round(59 * (1 - gradT) + 75 * gradT);
      let b = Math.round(112 * (1 - gradT) + 160 * gradT);
      let a = 255;

      // Draw Storefront Canopy / Roof in center top
      // Store roof: y between -0.6 and -0.1, x between -0.7 and 0.7
      if (ny >= -0.55 && ny <= -0.15 && Math.abs(nx) <= 0.65) {
        // Orange canopy stripes
        const stripe = Math.floor((nx + 0.65) / 0.26) % 2 === 0;
        if (stripe) {
          r = 249; g = 115; b = 22; // Orange #F97316
        } else {
          r = 255; g = 255; b = 255; // White
        }
      }

      // Roof eave / orange highlight bar
      if (ny > -0.15 && ny <= -0.07 && Math.abs(nx) <= 0.7) {
        r = 249; g = 115; b = 22;
      }

      // Draw Stylized 'A' Monogram / Doorframe below canopy
      // Left leg of A: nx around -0.3 + (ny * 0.4)
      const legDistL = Math.abs(nx - (-0.35 + (ny - 0.2) * 0.35));
      const legDistR = Math.abs(nx - (0.35 - (ny - 0.2) * 0.35));
      const barDist = Math.abs(ny - 0.25);

      if (ny > -0.07 && ny <= 0.65) {
        // Crossbar
        if (barDist < 0.08 && Math.abs(nx) <= 0.3) {
          r = 255; g = 255; b = 255;
        }
        // Legs
        if ((legDistL < 0.09 || legDistR < 0.09) && ny >= 0.0) {
          r = 255; g = 255; b = 255;
        }
        // Top peak of A
        if (Math.abs(nx) < 0.12 && ny < 0.1) {
          r = 249; g = 115; b = 22; // Orange accent at the apex
        }
      }

      // Small Orange Star/Badge on upper right
      const starDx = nx - 0.5;
      const starDy = ny - (-0.45);
      if (starDx * starDx + starDy * starDy < 0.015) {
        r = 249; g = 115; b = 22; // Orange dot
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // Deflate IDAT
  const compressed = zlib.deflateSync(rawData, { level: 9 });

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = createPngChunk('IDAT', compressed);

  // IEND
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate SVG vector icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E2D56" />
      <stop offset="50%" stop-color="#123B70" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#EA580C" />
      <stop offset="100%" stop-color="#F97316" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- Background Squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />

  <!-- Subtle glow ring -->
  <rect x="16" y="16" width="480" height="480" rx="98" fill="none" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="4" />

  <g filter="url(#shadow)" transform="translate(256, 260)">
    <!-- Store Canopy Roof -->
    <path d="M-150,-120 L150,-120 L130,-40 L-130,-40 Z" fill="url(#orangeGrad)" />
    <!-- White canopy stripes -->
    <polygon points="-75,-120 -40,-120 -35,-40 -70,-40" fill="#FFFFFF" opacity="0.9" />
    <polygon points="40,-120 75,-120 70,-40 35,-40" fill="#FFFFFF" opacity="0.9" />
    
    <!-- Canopy Scallop / Eaves -->
    <path d="M-130,-40 C-110,-25 -90,-25 -70,-40 C-50,-25 -30,-25 -10,-40 C10,-25 30,-25 50,-40 C70,-25 90,-25 110,-40 C120,-30 125,-35 130,-40" fill="none" stroke="#F97316" stroke-width="8" stroke-linecap="round" />

    <!-- Stylized 'A' / Store Entrance Pillars -->
    <!-- Left Leg -->
    <line x1="-80" y1="120" x2="-20" y2="-10" stroke="#FFFFFF" stroke-width="26" stroke-linecap="round" />
    <!-- Right Leg -->
    <line x1="80" y1="120" x2="20" y2="-10" stroke="#FFFFFF" stroke-width="26" stroke-linecap="round" />
    <!-- Crossbar -->
    <line x1="-55" y1="55" x2="55" y2="55" stroke="#F97316" stroke-width="22" stroke-linecap="round" />

    <!-- Apex Emblem -->
    <circle cx="0" cy="-10" r="14" fill="#F97316" />
    <circle cx="0" cy="-10" r="7" fill="#FFFFFF" />

    <!-- Digital sparkle star on top right -->
    <path d="M120,-130 Q120,-100 150,-100 Q120,-100 120,-70 Q120,-100 90,-100 Q120,-100 120,-130 Z" fill="#FBBF24" />
  </g>

  <!-- Tagline text in icon -->
  <text x="256" y="445" font-family="'Inter', -apple-system, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">ANMOL STORE</text>
</svg>`;

// Write SVG
fs.writeFileSync(path.join(outputDir, 'icon.svg'), svgContent, 'utf8');
console.log('✓ Created frontend/assets/icons/icon.svg');

// Generate 192x192
const icon192 = generateAnmolIconPng(192, false);
fs.writeFileSync(path.join(outputDir, 'icon-192.png'), icon192);
console.log('✓ Created frontend/assets/icons/icon-192.png');

// Generate 512x512
const icon512 = generateAnmolIconPng(512, false);
fs.writeFileSync(path.join(outputDir, 'icon-512.png'), icon512);
console.log('✓ Created frontend/assets/icons/icon-512.png');

// Generate maskable icons
const maskable192 = generateAnmolIconPng(192, true);
fs.writeFileSync(path.join(outputDir, 'icon-maskable-192.png'), maskable192);
console.log('✓ Created frontend/assets/icons/icon-maskable-192.png');

const maskable512 = generateAnmolIconPng(512, true);
fs.writeFileSync(path.join(outputDir, 'icon-maskable-512.png'), maskable512);
console.log('✓ Created frontend/assets/icons/icon-maskable-512.png');

console.log('All ANMOL STORE app icons generated successfully!');
