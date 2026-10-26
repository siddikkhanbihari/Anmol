// ANMOL STORE - Database Connection Manager
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let memoryServer = null;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;

  try {
    if (uri && uri !== 'memory') {
      console.log(`Connecting to configured MongoDB at ${uri.split('@').pop()}...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('✓ Successfully connected to MongoDB Database');
      return;
    }
  } catch (err) {
    console.warn(`! Failed to connect to external MongoDB: ${err.message}`);
    console.log('Falling back to zero-configuration In-Memory MongoDB Server...');
  }

  // Fallback to In-Memory MongoDB Server
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`✓ In-Memory MongoDB Server running and connected at: ${memoryUri}`);
    console.log('  [ANMOL STORE is fully operational in standalone development/test mode]');
  } catch (memErr) {
    console.error('Fatal: Could not initialize in-memory database:', memErr.message);
    throw memErr;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
