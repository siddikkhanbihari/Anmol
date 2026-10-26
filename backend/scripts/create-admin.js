// ANMOL STORE - First Admin Provisioning Script
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User, AuditLog } from '../src/models/index.js';

async function createAdmin() {
  try {
    await connectDB();

    const email = (process.env.INITIAL_ADMIN_EMAIL || 'admin@anmolstore.in').toLowerCase();
    const password = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@Anmol2026';
    const name = process.env.INITIAL_ADMIN_NAME || 'Platform Administrator';
    const phone = process.env.INITIAL_ADMIN_PHONE || '9876543210';

    let admin = await User.findOne({ email });

    if (admin) {
      console.log(`ℹ Admin account already exists: ${email}`);
      admin.role = 'admin';
      admin.passwordHash = password;
      await admin.save();
      console.log('✓ Admin role and password refreshed.');
    } else {
      admin = await User.create({
        name,
        email,
        phone,
        passwordHash: password,
        role: 'admin',
        status: 'active'
      });
      console.log(`✓ Admin account created successfully for: ${email}`);
    }

    await AuditLog.create({
      admin: admin._id,
      action: 'ADMIN_INITIALIZED',
      targetEntity: 'User',
      entityId: admin._id.toString(),
      details: { email }
    });

    console.log('\n--- Admin Login Credentials ---');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('-------------------------------\n');
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

createAdmin();
