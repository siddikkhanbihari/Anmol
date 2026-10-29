// Vercel Serverless Function Handler for ANMOL STORE API
import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';
import { Category } from '../backend/src/models/index.js';
import { seedDatabase } from '../backend/scripts/seed.js';

let isSeeded = false;

export default async function handler(req, res) {
  try {
    await connectDB();

    if (!isSeeded) {
      const count = await Category.countDocuments();
      if (count === 0) {
        console.log('[Vercel Serverless] Fresh database detected. Auto-seeding catalog...');
        await seedDatabase();
      }
      isSeeded = true;
    }
  } catch (err) {
    console.error('[Vercel Serverless] Database initialization notice:', err.message);
  }

  // Restore original request path if rewritten to /api/index.js by Vercel
  const originalPath = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'];
  if (originalPath && (req.url === '/api/index.js' || req.url.startsWith('/api/index.js?'))) {
    req.url = originalPath;
  }

  return app(req, res);
}
