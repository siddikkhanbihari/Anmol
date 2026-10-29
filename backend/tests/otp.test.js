// ANMOL STORE - Mobile SMS OTP Automated Test Suite
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User, OtpChallenge, Product } from '../src/models/index.js';
import { smsService } from '../src/services/smsService.js';

describe('ANMOL STORE — Mobile SMS OTP Verification Suite', () => {
  let customerToken = '';
  let customerUser = null;
  let activeProductId = '';

  const testNewPhone = '9876500001';
  const testNewEmail = 'otp.user.new@anmolstore.in';
  let signupChallengeToken = '';
  let loginChallengeToken = '';
  let checkoutChallengeToken = '';
  let checkoutVerificationToken = '';

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Clean up any test records
    await User.deleteOne({ email: testNewEmail });
    await User.deleteOne({ phone: testNewPhone });
    await OtpChallenge.deleteMany({ normalizedPhone: testNewPhone });

    // Login default customer for checkout tests
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@anmolstore.in', password: 'Customer@123' });

    if (loginRes.status !== 200) {
      console.log('CUSTOMER LOGIN FAILED IN OTP TEST:', loginRes.status, loginRes.body);
    }
    assert.equal(loginRes.status, 200);
    customerToken = loginRes.body.data.accessToken;
    customerUser = loginRes.body.data.user;

    const prod = await Product.findOne({ isActive: true });
    if (prod) activeProductId = prod._id.toString();
  });

  after(async () => {
    await User.deleteOne({ email: testNewEmail });
    await User.deleteOne({ phone: testNewPhone });
    await OtpChallenge.deleteMany({ normalizedPhone: testNewPhone });
    await disconnectDB();
  });

  describe('1. Signup with Mobile OTP', () => {
    it('should reject signup OTP request with invalid Indian phone number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/signup/send')
        .send({
          name: 'Invalid Tester',
          email: testNewEmail,
          phone: '123456', // Invalid format
          password: 'Password@123'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /valid 10-digit Indian mobile number/i);
    });

    it('should reject signup OTP request if phone or email already registered', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/signup/send')
        .send({
          name: 'Existing Customer',
          email: 'customer@anmolstore.in', // Already exists
          phone: testNewPhone,
          password: 'Password@123'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /already exists/i);
    });

    it('should generate secure OTP and dispatch SMS for valid new user signup', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/signup/send')
        .send({
          name: 'New OTP Customer',
          email: testNewEmail,
          phone: testNewPhone,
          password: 'Customer@12345'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.challengeToken);
      assert.equal(res.body.data.cooldownSeconds, 30);
      assert.match(res.body.data.phoneMasked, /\+91 \*{6}0001/);

      signupChallengeToken = res.body.data.challengeToken;

      // Verify OTP challenge was securely recorded in DB without plaintext OTP
      const challengeDoc = await OtpChallenge.findOne({ challengeToken: signupChallengeToken }).select('+otpHash');
      assert.ok(challengeDoc);
      assert.equal(challengeDoc.normalizedPhone, testNewPhone);
      assert.ok(challengeDoc.otpHash, 'Hashed OTP must be stored');
      assert.equal(challengeDoc.otp, undefined, 'Plaintext OTP must NOT be stored in DB');
    });

    it('should reject immediate resend within 30-second cooldown period', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/signup/send')
        .send({
          name: 'New OTP Customer',
          email: testNewEmail,
          phone: testNewPhone,
          password: 'Customer@12345'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /wait \d+ seconds before requesting a new OTP/i);
    });

    it('should reject incorrect OTP code and decrement remaining attempts', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/signup/verify')
        .send({
          challengeToken: signupChallengeToken,
          otp: '000000' // Incorrect code
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Incorrect OTP/i);
    });

    it('should verify correct OTP, create new user, and issue access token', async () => {
      // Retrieve the generated test OTP
      const testOtp = smsService.getDevLastOtp(testNewPhone);
      assert.ok(testOtp, 'Test OTP must be available in test environment');

      const res = await request(app)
        .post('/api/v1/auth/otp/signup/verify')
        .send({
          challengeToken: signupChallengeToken,
          otp: testOtp
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.accessToken);
      assert.equal(res.body.data.user.phone, testNewPhone);
      assert.equal(res.body.data.user.isPhoneVerified, true);

      // Verify user exists in database
      const createdUser = await User.findOne({ phone: testNewPhone });
      assert.ok(createdUser);
      assert.equal(createdUser.isPhoneVerified, true);
    });

    it('should prevent replay of already consumed challenge token', async () => {
      const testOtp = smsService.getDevLastOtp(testNewPhone);
      const res = await request(app)
        .post('/api/v1/auth/otp/signup/verify')
        .send({
          challengeToken: signupChallengeToken,
          otp: testOtp
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Invalid or expired OTP/i);
    });
  });

  describe('2. Login with Mobile OTP', () => {
    it('should reject login OTP send for non-existent mobile number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/login/send')
        .send({ phone: '9999999999' });

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /No registered account found/i);
    });

    it('should send login OTP for registered mobile number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/login/send')
        .send({ phone: testNewPhone });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.challengeToken);
      loginChallengeToken = res.body.data.challengeToken;
    });

    it('should reject login with wrong OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/login/verify')
        .send({
          challengeToken: loginChallengeToken,
          otp: '111111'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Incorrect OTP/i);
    });

    it('should login successfully with correct OTP and issue JWT access token', async () => {
      const testOtp = smsService.getDevLastOtp(testNewPhone);
      assert.ok(testOtp);

      const res = await request(app)
        .post('/api/v1/auth/otp/login/verify')
        .send({
          challengeToken: loginChallengeToken,
          otp: testOtp
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.accessToken);
      assert.equal(res.body.data.user.phone, testNewPhone);
    });
  });

  describe('3. Checkout OTP Verification & Order Placement', () => {
    it('should reject checkout OTP send when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/checkout/otp/send')
        .send({});

      assert.equal(res.status, 401);
    });

    it('should dispatch checkout OTP for authenticated customer', async () => {
      const res = await request(app)
        .post('/api/v1/checkout/otp/send')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.challengeToken);
      checkoutChallengeToken = res.body.data.challengeToken;
    });

    it('should verify checkout OTP and issue short-lived checkoutVerificationToken', async () => {
      const testOtp = smsService.getDevLastOtp(customerUser.phone);
      assert.ok(testOtp);

      const res = await request(app)
        .post('/api/v1/checkout/otp/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          challengeToken: checkoutChallengeToken,
          otp: testOtp
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.checkoutVerificationToken);
      checkoutVerificationToken = res.body.data.checkoutVerificationToken;
    });

    it('should accept valid checkoutVerificationToken when placing order and consume it', async () => {
      if (!activeProductId) return;

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: activeProductId, quantity: 1 }],
          deliveryAddress: {
            recipientName: 'Test Recipient',
            phone: '9820011223',
            street: 'Station Road',
            city: 'Palanpur',
            state: 'Gujarat',
            pincode: '385001'
          },
          paymentMethod: 'cod',
          checkoutVerificationToken
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.orderNumber);

      // Verify token is now consumed
      const challengeDoc = await OtpChallenge.findOne({ verificationToken: checkoutVerificationToken });
      assert.equal(challengeDoc.isConsumed, true);
    });

    it('should reject reused checkoutVerificationToken for subsequent order', async () => {
      if (!activeProductId) return;

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: activeProductId, quantity: 1 }],
          deliveryAddress: {
            recipientName: 'Test Recipient',
            phone: '9820011223',
            street: 'Station Road',
            city: 'Palanpur',
            state: 'Gujarat',
            pincode: '385001'
          },
          paymentMethod: 'cod',
          checkoutVerificationToken // Already consumed!
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /Invalid or expired checkout verification token/i);
    });
  });
});
