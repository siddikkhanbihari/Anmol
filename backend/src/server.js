// ANMOL STORE - Server Entry Point
import dotenv from 'dotenv';
dotenv.config();

import os from 'os';
import app from './app.js';
import { connectDB } from './config/db.js';
import { Category } from './models/index.js';
import { seedDatabase } from '../scripts/seed.js';

const PORT = process.env.PORT || 5000;

function getNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

async function startServer() {
  try {
    await connectDB();

    // Auto-seed if database is currently fresh/empty
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('Fresh database detected. Auto-seeding initial catalog and demo data...');
      await seedDatabase();
    }

    const networkIp = getNetworkIp();

    app.listen(PORT, '0.0.0.0', () => {
      console.log('====================================================');
      console.log('  ANMOL STORE — Premium Local Business Marketplace  ');
      console.log('  "Aapki Dukaan, Aapka Business, Aapki Pehchaan"    ');
      console.log('  LOCAL BUSINESS, DIGITAL FUTURE                    ');
      console.log('====================================================');
      console.log(`✓ Local (PC):    http://localhost:${PORT}/`);
      console.log(`✓ Mobile (Phone): http://${networkIp}:${PORT}/`);
      console.log('----------------------------------------------------');
      console.log(`📱 PHONE ACCESS INSTRUCTION:`);
      console.log(`1. Make sure your phone is on the SAME Wi-Fi / Hotspot`);
      console.log(`2. Open Chrome/Safari on your phone and go to:`);
      console.log(`   http://${networkIp}:${PORT}`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('Fatal Server Startup Error:', error);
    process.exit(1);
  }
}

startServer();
