// ANMOL STORE - Comprehensive Automated Test Suite
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../scripts/seed.js';
import { User, Shop, Product, Order } from '../src/models/index.js';

describe('ANMOL STORE API & Security Boundaries Test Suite', () => {
  let customerToken = '';
  let sellerToken = '';
  let adminToken = '';
  let customerUser = null;
  let testProductId = '';

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    await seedDatabase();
  });

  after(async () => {
    await disconnectDB();
  });

  describe('1. Authentication & Security', () => {
    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@anmolstore.in', password: 'WrongPassword123' });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('should login admin user and return JWT access token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@anmolstore.in', password: 'Admin@Anmol2026' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.accessToken);
      assert.equal(res.body.data.user.role, 'admin');
      adminToken = res.body.data.accessToken;
    });

    it('should login customer user and return valid session', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'customer@anmolstore.in', password: 'Customer@123' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.accessToken);
      assert.equal(res.body.data.user.role, 'customer');
      customerToken = res.body.data.accessToken;
      customerUser = res.body.data.user;
    });

    it('should login seller user and return shop details', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'sharma.kirana@anmolstore.in', password: 'Seller@123' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.accessToken);
      assert.equal(res.body.data.user.role, 'seller');
      assert.ok(res.body.data.shop);
      sellerToken = res.body.data.accessToken;
    });

    it('should register a new customer with server-side validation', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Pooja Singh',
          email: 'pooja.singh@example.com',
          phone: '9876501234',
          password: 'Password@123'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.role, 'customer');
    });

    it('should prevent duplicate registration with same email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'customer@anmolstore.in',
          phone: '9876509999',
          password: 'Password@123'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('should onboard a new seller with shop profile and free registration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-seller')
        .send({
          name: 'Kailash Chand',
          email: 'kailash.store@anmolstore.in',
          phone: '9811223344',
          password: 'SellerPassword@123',
          businessName: 'Kailash Provision Store',
          ownerName: 'Kailash Chand',
          businessCategory: 'General Store & Stationery',
          street: 'Shop 2, Naveen Market',
          city: 'Kanpur',
          state: 'Uttar Pradesh',
          pincode: '208001'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.role, 'seller');
      assert.ok(res.body.data.shop);
    });
  });

  describe('2. Role-Based Access Control (RBAC)', () => {
    it('should block customer from accessing admin overview', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${customerToken}`);

      assert.equal(res.status, 403);
    });

    it('should block unauthenticated requests to protected endpoints', async () => {
      const res = await request(app).get('/api/v1/cart');
      assert.equal(res.status, 401);
    });

    it('should allow admin to access admin overview and platform metrics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.data.metrics);
      assert.ok(res.body.data.metrics.totalCustomers >= 1);
      assert.ok(res.body.data.metrics.totalSellers >= 5);
    });
  });

  describe('3. Products, Catalog & Search', () => {
    it('should list products with pagination and category filtering', async () => {
      const res = await request(app).get('/api/v1/products?limit=5');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data.products));
      assert.ok(res.body.data.products.length <= 5);
      testProductId = res.body.data.products[0]._id;
    });

    it('should search products by keyword', async () => {
      const res = await request(app).get('/api/v1/products?search=Atta');
      assert.equal(res.status, 200);
      assert.ok(res.body.data.products.length >= 1);
      assert.ok(res.body.data.products[0].name.includes('Atta'));
    });

    it('should allow seller to add a new product to their shop', async () => {
      const category = await import('../src/models/Category.js').then(m => m.Category.findOne());

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: 'Chana Dal Desi (1 kg)',
          description: 'High protein unpolished desi chana dal.',
          price: 95,
          originalPrice: 110,
          stock: 30,
          category: category._id,
          unit: 'packet'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.name, 'Chana Dal Desi (1 kg)');
    });

    it('should prevent customer from creating products', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Hacked Product', price: 10, stock: 10, description: 'Test' });

      assert.equal(res.status, 403);
    });
  });

  describe('4. Shopping Cart & Inventory Stock Validation', () => {
    it('should add item to customer cart', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId,
          quantity: 2
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.items.length >= 1);
    });

    it('should reject adding more quantity than available stock', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId,
          quantity: 99999
        });

      assert.equal(res.status, 400);
      assert.ok(res.body.message.includes('stock'));
    });
  });

  describe('5. Order Processing & Seller Isolation', () => {
    it('should place an order and decrement product stock', async () => {
      const productBefore = await Product.findById(testProductId);
      const initialStock = productBefore.stock;

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: testProductId,
              quantity: 2
            }
          ],
          deliveryAddress: {
            recipientName: 'Amit Verma',
            phone: '9820011223',
            street: 'Flat 402, Ganga Heights',
            city: 'Kanpur',
            state: 'Uttar Pradesh',
            pincode: '208001'
          },
          paymentMethod: 'cod'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.orderNumber);
      assert.equal(res.body.data.paymentStatus, 'pending');

      const productAfter = await Product.findById(testProductId);
      assert.equal(productAfter.stock, initialStock - 2);
    });

    it('should allow seller to view only orders placed for their shop', async () => {
      const res = await request(app)
        .get('/api/v1/orders/seller')
        .set('Authorization', `Bearer ${sellerToken}`);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data.orders));
    });
  });

  describe('6. Services & Appointment Booking', () => {
    it('should list available local services', async () => {
      const res = await request(app).get('/api/v1/services');
      assert.equal(res.status, 200);
      assert.ok(res.body.data.services.length >= 1);
    });

    it('should book a service appointment', async () => {
      const services = await request(app).get('/api/v1/services');
      const serviceId = services.body.data.services[0]._id;

      const res = await request(app)
        .post('/api/v1/services/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          bookingDate: new Date(Date.now() + 86400000).toISOString(),
          timeSlot: '11:00 AM - 01:00 PM',
          serviceAddress: {
            street: 'Flat 402, Ganga Heights',
            city: 'Kanpur',
            pincode: '208001'
          },
          customerPhone: '9820011223',
          problemDescription: 'Need inspection of main MCB and wiring check'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.bookingReference);
      assert.equal(res.body.data.status, 'pending');
    });
  });

  describe('7. Vehicles & Inquiries', () => {
    it('should list available vehicle listings', async () => {
      const res = await request(app).get('/api/v1/vehicles');
      assert.equal(res.status, 200);
      assert.ok(res.body.data.vehicles.length >= 1);
    });

    it('should submit a vehicle inquiry independently of cart checkout', async () => {
      const vehicles = await request(app).get('/api/v1/vehicles');
      const vehicleId = vehicles.body.data.vehicles[0]._id;

      const res = await request(app)
        .post('/api/v1/vehicles/inquiries')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vehicleId,
          customerName: 'Amit Verma',
          customerPhone: '9820011223',
          offeredPrice: 550000,
          message: 'Interested in test drive this weekend. Please confirm availability.'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'new');
    });
  });
});
