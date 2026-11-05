// ANMOL STORE - Comprehensive Database Seeder
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  User,
  SellerProfile,
  Shop,
  Category,
  Product,
  ServiceListing,
  VehicleListing,
  PlatformSettings,
  Address,
  Review,
  RiderProfile
} from '../src/models/index.js';

export async function seedDatabase() {
  try {
    console.log('--- Starting ANMOL STORE Database Seeding ---');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      SellerProfile.deleteMany({}),
      Shop.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      ServiceListing.deleteMany({}),
      VehicleListing.deleteMany({}),
      PlatformSettings.deleteMany({}),
      Address.deleteMany({}),
      Review.deleteMany({}),
      RiderProfile.deleteMany({})
    ]);

    console.log('✓ Cleared existing records.');

    // 1. Platform Settings
    await PlatformSettings.create({
      key: 'main_settings',
      platformName: 'ANMOL STORE',
      primaryTagline: 'Aapki Dukaan, Aapka Business, Aapki Pehchaan',
      secondaryTagline: 'LOCAL BUSINESS, DIGITAL FUTURE',
      freeSellerRegistration: true,
      autoApproveSellers: false,
      defaultDeliveryCharge: 40,
      freeDeliveryThreshold: 499,
      commissionRatePercent: 0,
      codEnabled: true,
      onlinePaymentEnabled: true,
      maintenanceMode: false
    });
    console.log('✓ Platform settings initialized (Free Seller Registration Enabled).');

    // 2. Categories
    const categoriesData = [
      {
        name: 'Kirana & Grocery',
        slug: 'kirana-grocery',
        icon: 'fa-shopping-basket',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
        type: 'product',
        order: 1
      },
      {
        name: 'Mobile & Accessories',
        slug: 'mobile-accessories',
        icon: 'fa-mobile-screen-button',
        image: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80',
        type: 'product',
        order: 2
      },
      {
        name: 'Electronics & Mobile',
        slug: 'electronics-mobile',
        icon: 'fa-laptop',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        type: 'product',
        order: 3
      },
      {
        name: 'Hardware & Machinery',
        slug: 'hardware-machinery',
        icon: 'fa-tools',
        image: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=600&q=80',
        type: 'product',
        order: 4
      },
      {
        name: 'Home & Stationery',
        slug: 'home-stationery',
        icon: 'fa-book-open',
        image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=600&q=80',
        type: 'product',
        order: 5
      },
      {
        name: 'Repair & Electrician Services',
        slug: 'repair-electrician',
        icon: 'fa-bolt',
        image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
        type: 'service',
        order: 6
      },
      {
        name: 'Auto Garage & Bike Services',
        slug: 'auto-garage-services',
        icon: 'fa-wrench',
        image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
        type: 'service',
        order: 7
      },
      {
        name: 'Plumbing & Labour Services',
        slug: 'plumbing-labour-services',
        icon: 'fa-faucet',
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
        type: 'service',
        order: 8
      },
      {
        name: 'Cars & Bikes (Pre-Owned)',
        slug: 'cars-and-bikes',
        icon: 'fa-car',
        image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        type: 'vehicle',
        order: 9
      }
    ];

    const categories = await Category.insertMany(categoriesData);
    const catMap = {};
    categories.forEach(c => { catMap[c.slug] = c; });
    console.log(`✓ Seeded ${categories.length} Categories.`);

    // 3. Admin User
    const adminUser = await User.create({
      name: 'Admin Anmol',
      email: 'admin@anmolstore.in',
      phone: '9876543210',
      passwordHash: 'Admin@Anmol2026',
      role: 'admin',
      status: 'active'
    });

    // 4. Customer User
    const customerUser = await User.create({
      name: 'Amit Verma',
      email: 'customer@anmolstore.in',
      phone: '9820011223',
      passwordHash: 'Customer@123',
      role: 'customer',
      status: 'active'
    });

    await Address.create({
      user: customerUser._id,
      recipientName: 'Amit Verma',
      phone: '9820011223',
      street: 'Flat 402, Cozy Tower, Near Aroma Circle',
      landmark: 'Near Aroma Circle',
      city: 'Palanpur',
      state: 'Gujarat',
      pincode: '385001',
      addressType: 'Home',
      isDefault: true
    });
    console.log('✓ Seeded Admin and Customer users.');

    // 4b. Delivery Partner (Rider) User
    const riderUser = await User.create({
      name: 'Raju Kumar (Delivery Partner)',
      email: 'rider@anmolstore.in',
      phone: '9876500001',
      passwordHash: 'Rider@123',
      role: 'rider',
      status: 'active'
    });

    await RiderProfile.create({
      user: riderUser._id,
      vehicleType: 'bike',
      vehicleNumber: 'GJ 08 CD 4321',
      drivingLicenseNumber: 'DL-GJ08-2023-0099',
      city: 'Palanpur',
      serviceAreas: ['Aroma Circle', 'Station Road', 'Deesa Highway', 'Delhi Gate', 'Gathaman Gate'],
      isOnline: true,
      isApproved: true,
      rating: 4.95,
      totalRatings: 48,
      todayEarnings: 240,
      todayDeliveries: 6,
      totalEarnings: 6800,
      totalDeliveries: 170
    });
    console.log('✓ Seeded Demo Delivery Partner (rider@anmolstore.in / Rider@123).');

    // 5. Sellers & Shops
    // Seller 1: Sharma Kirana & General Store
    const seller1User = await User.create({
      name: 'Ramesh Sharma',
      email: 'sharma.kirana@anmolstore.in',
      phone: '9839011122',
      passwordHash: 'Seller@123',
      role: 'seller',
      status: 'active'
    });

    const seller1Profile = await SellerProfile.create({
      user: seller1User._id,
      businessName: 'Sharma Kirana & General Store',
      ownerName: 'Ramesh Sharma',
      businessCategory: 'Kirana & Grocery',
      panNumber: 'ABCPS1234F',
      gstin: '24ABCPS1234F1Z5',
      approvalStatus: 'approved',
      approvedAt: new Date()
    });

    const shop1 = await Shop.create({
      sellerProfile: seller1Profile._id,
      user: seller1User._id,
      name: 'Sharma Kirana & General Store',
      slug: 'sharma-kirana-store',
      description: 'Serving Palanpur since 1998 with authentic, fresh daily groceries, pulses, grains, and dry fruits directly from trusted mandis.',
      category: 'Kirana & Grocery',
      logo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=200&q=80',
      coverImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      address: {
        street: 'Shop 14, Main Market, Aroma Circle',
        city: 'Palanpur',
        state: 'Gujarat',
        pincode: '385001',
        landmark: 'Opposite Aroma Circle Garden'
      },
      operatingAreas: ['Aroma Circle', 'Station Road', 'Delhi Gate', 'Shimla Gate'],
      deliveryPincodes: ['385001'],
      businessHours: { open: '08:00 AM', close: '10:00 PM', days: 'Mon - Sun' },
      contactPhone: '9839011122',
      rating: 4.8,
      reviewCount: 38,
      isVerified: true,
      isActive: true,
      deliveryCharge: 30
    });

    // Seller 2: Verma Electronics & Mobile Care
    const seller2User = await User.create({
      name: 'Rajesh Verma',
      email: 'verma.electronics@anmolstore.in',
      phone: '9839022233',
      passwordHash: 'Seller@123',
      role: 'seller',
      status: 'active'
    });

    const seller2Profile = await SellerProfile.create({
      user: seller2User._id,
      businessName: 'Verma Electronics & Mobile Care',
      ownerName: 'Rajesh Verma',
      businessCategory: 'Electronics & Mobile',
      panNumber: 'XYZPV5678K',
      approvalStatus: 'approved',
      approvedAt: new Date()
    });

    const shop2 = await Shop.create({
      sellerProfile: seller2Profile._id,
      user: seller2User._id,
      name: 'Verma Electronics & Mobile Care',
      slug: 'verma-electronics-mobile',
      description: 'Original mobile accessories, smart gadgets, audio gear, and certified mobile repair services with genuine parts and warranty.',
      category: 'Electronics & Mobile',
      logo: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=200&q=80',
      coverImage: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80',
      address: {
        street: 'Shop 4, Station Road Plaza',
        city: 'Palanpur',
        state: 'Gujarat',
        pincode: '385001'
      },
      operatingAreas: ['Station Road', 'Guru Nanak Chowk', 'Cozy Area', 'Abu Highway'],
      deliveryPincodes: ['385001'],
      businessHours: { open: '10:00 AM', close: '09:00 PM', days: 'Tue - Sun (Mon Closed)' },
      contactPhone: '9839022233',
      rating: 4.9,
      reviewCount: 52,
      isVerified: true,
      isActive: true,
      deliveryCharge: 40
    });

    // Seller 3: Gupta Auto Garage & Bike Care
    const seller3User = await User.create({
      name: 'Manoj Gupta',
      email: 'gupta.garage@anmolstore.in',
      phone: '9839033344',
      passwordHash: 'Seller@123',
      role: 'seller',
      status: 'active'
    });

    const seller3Profile = await SellerProfile.create({
      user: seller3User._id,
      businessName: 'Gupta Auto Garage & Bike Service',
      ownerName: 'Manoj Gupta',
      businessCategory: 'Auto Garage & Repair',
      approvalStatus: 'approved',
      approvedAt: new Date()
    });

    const shop3 = await Shop.create({
      sellerProfile: seller3Profile._id,
      user: seller3User._id,
      name: 'Gupta Auto Garage & Bike Service',
      slug: 'gupta-auto-garage',
      description: 'Professional two-wheeler & car servicing, engine overhaul, tyre alignment, and doorstep breakdown assistance in Palanpur.',
      category: 'Auto Garage & Repair',
      logo: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=200&q=80',
      coverImage: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80',
      address: {
        street: 'Plot 12, Abu Highway, Near Cozy Chauraha',
        city: 'Palanpur',
        state: 'Gujarat',
        pincode: '385001'
      },
      operatingAreas: ['Abu Highway', 'Deesa Highway', 'GIDC Palanpur', 'Aroma Circle'],
      deliveryPincodes: ['385001'],
      businessHours: { open: '09:00 AM', close: '08:30 PM', days: 'Mon - Sun' },
      contactPhone: '9839033344',
      rating: 4.7,
      reviewCount: 29,
      isVerified: true,
      isActive: true,
      deliveryCharge: 0
    });

    // Seller 4: Om Sai Hardware & Electricals
    const seller4User = await User.create({
      name: 'Suresh Tiwari',
      email: 'tiwari.hardware@anmolstore.in',
      phone: '9839044455',
      passwordHash: 'Seller@123',
      role: 'seller',
      status: 'active'
    });

    const seller4Profile = await SellerProfile.create({
      user: seller4User._id,
      businessName: 'Om Sai Hardware & Electricals',
      ownerName: 'Suresh Tiwari',
      businessCategory: 'Hardware & Machinery',
      approvalStatus: 'approved',
      approvedAt: new Date()
    });

    const shop4 = await Shop.create({
      sellerProfile: seller4Profile._id,
      user: seller4User._id,
      name: 'Om Sai Hardware & Electricals',
      slug: 'om-sai-hardware',
      description: 'Industrial tools, bathroom fittings, electrical wires, switches, power drills, and certified on-call electrician services in Palanpur.',
      category: 'Hardware & Machinery',
      logo: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=200&q=80',
      coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
      address: {
        street: '88/14, Deesa Highway Road',
        city: 'Palanpur',
        state: 'Gujarat',
        pincode: '385001'
      },
      operatingAreas: ['Deesa Highway', 'Gathaman Gate', 'Kalyanpura', 'Taley Baug'],
      deliveryPincodes: ['385001'],
      businessHours: { open: '09:30 AM', close: '08:00 PM', days: 'Mon - Sat (Sun Closed)' },
      contactPhone: '9839044455',
      rating: 4.8,
      reviewCount: 33,
      isVerified: true,
      isActive: true,
      deliveryCharge: 50
    });

    // Seller 5: Patel Pre-Owned Cars & Bikes
    const seller5User = await User.create({
      name: 'Vikram Patel',
      email: 'patel.vehicles@anmolstore.in',
      phone: '9839055566',
      passwordHash: 'Seller@123',
      role: 'seller',
      status: 'active'
    });

    const seller5Profile = await SellerProfile.create({
      user: seller5User._id,
      businessName: 'Patel Pre-Owned Cars & Bikes',
      ownerName: 'Vikram Patel',
      businessCategory: 'Vehicles & Auto',
      approvalStatus: 'approved',
      approvedAt: new Date()
    });

    const shop5 = await Shop.create({
      sellerProfile: seller5Profile._id,
      user: seller5User._id,
      name: 'Patel Pre-Owned Cars & Bikes',
      slug: 'patel-preowned-vehicles',
      description: 'Trusted certified used cars and motorcycles with complete paper verification, clean history, and spot evaluation in Palanpur.',
      category: 'Vehicles & Auto',
      logo: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80',
      coverImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
      address: {
        street: 'Near GIDC Industrial Estate, Highway Road',
        city: 'Palanpur',
        state: 'Gujarat',
        pincode: '385001'
      },
      operatingAreas: ['Palanpur', 'Deesa', 'Abu Road', 'Sidhpur'],
      businessHours: { open: '10:00 AM', close: '07:30 PM', days: 'Mon - Sun' },
      contactPhone: '9839055566',
      rating: 4.9,
      reviewCount: 41,
      isVerified: true,
      isActive: true
    });

    console.log('✓ Seeded 5 authentic local shops and sellers.');

    // 6. Products
    const productsData = [
      // Grocery
      {
        shop: shop1._id,
        seller: seller1User._id,
        category: catMap['kirana-grocery']._id,
        name: 'Aashirvaad Shudh Chakki Atta (5 kg)',
        slug: 'aashirvaad-atta-5kg',
        description: '100% pure whole wheat grain flour with dietary fibre and natural nutrients for soft rotis.',
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'],
        price: 245,
        originalPrice: 285,
        stock: 50,
        unit: 'packet',
        rating: 4.8,
        reviewCount: 15,
        tags: ['atta', 'flour', 'grocery', 'kirana', 'aashirvaad']
      },
      {
        shop: shop1._id,
        seller: seller1User._id,
        category: catMap['kirana-grocery']._id,
        name: 'Fortune Sunlite Refined Sunflower Oil (1 Litre)',
        slug: 'fortune-sunflower-oil-1l',
        description: 'Light and healthy refined sunflower cooking oil enriched with Vitamin A and D.',
        images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80'],
        price: 142,
        originalPrice: 165,
        stock: 35,
        unit: 'packet',
        rating: 4.7,
        reviewCount: 12,
        tags: ['oil', 'cooking oil', 'sunflower oil', 'grocery']
      },
      {
        shop: shop1._id,
        seller: seller1User._id,
        category: catMap['kirana-grocery']._id,
        name: 'Tata Tea Gold Leaf (500g)',
        slug: 'tata-tea-gold-500g',
        description: 'Exquisite blend of Assam tea leaves with 15% gently rolled aromatic long leaves.',
        images: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80'],
        price: 275,
        originalPrice: 320,
        stock: 40,
        unit: 'packet',
        rating: 4.9,
        reviewCount: 22,
        tags: ['tea', 'chai', 'tata tea', 'beverage']
      },
      {
        shop: shop1._id,
        seller: seller1User._id,
        category: catMap['kirana-grocery']._id,
        name: 'India Gate Basmati Rice Feast Rozzana (5 kg)',
        slug: 'india-gate-basmati-rice-5kg',
        description: 'Fluffy, long grain aromatic basmati rice for everyday family meals and biryanis.',
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'],
        price: 430,
        originalPrice: 510,
        stock: 25,
        unit: 'packet',
        rating: 4.8,
        reviewCount: 9,
        tags: ['rice', 'basmati', 'chawal', 'grocery']
      },

      // Mobile & Accessories
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: '11D Full Glue Edge-to-Edge Tempered Glass (9H HD Clear)',
        slug: '11d-full-glue-edge-to-edge-tempered-glass',
        description: 'Oleophobic coating resists oil and smudges. 9H hardness shatterproof Japanese Asahi glass with 99.9% transparency and bubble-free installation.',
        images: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=600&q=80'],
        price: 149,
        originalPrice: 399,
        stock: 100,
        unit: 'piece',
        rating: 4.8,
        reviewCount: 42,
        tags: ['tempered glass', 'screen protector', '9h glass', 'mobile accessory', 'guard', 'mobile']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Privacy Anti-Spy 9H Tempered Glass Screen Protector',
        slug: 'privacy-anti-spy-tempered-glass',
        description: '2-way privacy filter prevents side-angle peeping in public. Anti-scratch, explosion-proof tempered glass with ultra-smooth touch sensitivity.',
        images: ['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80'],
        price: 249,
        originalPrice: 499,
        stock: 60,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 28,
        tags: ['privacy glass', 'screen protector', 'anti spy', 'mobile accessory', 'tempered glass']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Shockproof Rugged Armor Case with Magnetic Ring Kickstand',
        slug: 'shockproof-armor-magnetic-kickstand-case',
        description: 'Dual-layer TPU + PC shock-absorbing armor with 360-degree rotating metal ring holder and magnetic car mount plate.',
        images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80'],
        price: 299,
        originalPrice: 699,
        stock: 45,
        unit: 'piece',
        rating: 4.8,
        reviewCount: 35,
        tags: ['phone cover', 'back case', 'shockproof', 'mobile cover', 'stand case', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Premium Liquid Silicone Soft Back Case with Microfiber Lining',
        slug: 'premium-liquid-silicone-soft-back-case',
        description: 'Silky soft-touch matte finish, anti-fingerprint, full body camera protection bumper, and soft inner microfiber scratch guard.',
        images: ['https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?auto=format&fit=crop&w=600&q=80'],
        price: 199,
        originalPrice: 499,
        stock: 55,
        unit: 'piece',
        rating: 4.7,
        reviewCount: 23,
        tags: ['silicone case', 'mobile cover', 'matte cover', 'back cover', 'soft case', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Clear Hybrid Air-Cushion Shockproof Transparent Case',
        slug: 'clear-hybrid-air-cushion-transparent-case',
        description: 'Crystal clear anti-yellowing German Bayer TPU with reinforced corner air-cushions for 6-feet drop protection.',
        images: ['https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=600&q=80'],
        price: 149,
        originalPrice: 349,
        stock: 70,
        unit: 'piece',
        rating: 4.6,
        reviewCount: 19,
        tags: ['transparent cover', 'clear case', 'airbag case', 'mobile cover', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: '33W SuperVOOC / Dart USB-C Ultra Fast Wall Charger Adapter',
        slug: '33w-supervooc-fast-charger-adapter',
        description: 'Flash charge technology for OnePlus, Realme, Oppo, and Vivo smartphones. Smart IC chip protects against over-voltage and overheating.',
        images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80'],
        price: 699,
        originalPrice: 1299,
        stock: 35,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 39,
        tags: ['fast charger', '33w charger', 'type-c adapter', 'mobile charger', 'vooc', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: '20W PD Type-C Fast Power Adapter (Quick Charge 3.0)',
        slug: '20w-pd-type-c-fast-power-adapter',
        description: 'Compact Power Delivery (PD) fast charging adapter compatible with iPhones and all Type-C Android smartphones.',
        images: ['https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=600&q=80'],
        price: 499,
        originalPrice: 999,
        stock: 40,
        unit: 'piece',
        rating: 4.8,
        reviewCount: 31,
        tags: ['20w charger', 'pd charger', 'iphone charger', 'type-c', 'mobile adapter', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: '65W Heavy-Duty Braided Type-C to Type-C Fast Charging Cable (1.2m)',
        slug: '65w-braided-type-c-to-type-c-cable',
        description: 'Nylon braided unbreakable cable with 65W PD fast charging and 480Mbps high-speed data transfer support.',
        images: ['https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=600&q=80'],
        price: 249,
        originalPrice: 599,
        stock: 65,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 45,
        tags: ['type-c cable', 'charging cable', 'braided cable', 'data cable', 'fast charging', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: '3-in-1 Multi Fast Charging Nylon Cable (Type-C + Micro-USB + Lightning)',
        slug: '3-in-1-multi-fast-charging-cable',
        description: 'Charge up to 3 devices simultaneously with 3.5A total output. High durability aluminum alloy connectors.',
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
        price: 299,
        originalPrice: 699,
        stock: 50,
        unit: 'piece',
        rating: 4.7,
        reviewCount: 22,
        tags: ['3 in 1 cable', 'multi charger', 'lightning cable', 'type-c', 'micro usb', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'boAt Airdopes 141 True Wireless Earbuds (42H Playtime)',
        slug: 'boat-airdopes-141-tws-earbuds',
        description: 'ENx environmental noise cancelling tech, 8mm drivers with boAt Signature Sound, Insta Wake N Pair, and IPX4 sweat resistance.',
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80'],
        price: 1299,
        originalPrice: 2990,
        stock: 25,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 57,
        tags: ['tws', 'boat earbuds', 'bluetooth earphones', 'airdopes', 'wireless audio', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Portronics Harmonics 300 Bluetooth 5.0 Wireless Neckband',
        slug: 'portronics-harmonics-300-neckband',
        description: 'HD stereo sound with magnetic earbuds, up to 16 hours continuous playtime, Voice Assistant support, and ultra-lightweight collar band.',
        images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80'],
        price: 799,
        originalPrice: 1499,
        stock: 30,
        unit: 'piece',
        rating: 4.7,
        reviewCount: 26,
        tags: ['neckband', 'portronics', 'bluetooth', 'earphones', 'wireless neckband', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Real Bass In-Ear Wired Earphones with Mic (3.5mm Gold-Plated Jack)',
        slug: 'real-bass-wired-earphones-with-mic',
        description: 'Tangle-free flat cable with inline microphone and one-touch multifunction call/music controller. Dynamic 10mm bass drivers.',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
        price: 179,
        originalPrice: 399,
        stock: 80,
        unit: 'piece',
        rating: 4.6,
        reviewCount: 38,
        tags: ['wired earphones', '3.5mm earphones', 'handsfree', 'bass earphones', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'All-Metal 360° Rotating Bike & Motorcycle Mobile Holder with USB Charger',
        slug: 'all-metal-360-bike-mobile-holder-with-charger',
        description: 'Heavy-duty aluminium alloy handlebar mount with claw clamp lock and integrated 5V 2A USB quick charging port for riders and daily commuters.',
        images: ['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80'],
        price: 449,
        originalPrice: 899,
        stock: 30,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 33,
        tags: ['bike mobile holder', 'motorcycle holder', 'handlebar mount', 'mobile holder', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Foldable Aluminum Desktop Mobile & Tablet Stand',
        slug: 'foldable-aluminum-desktop-mobile-stand',
        description: 'Multi-angle adjustable desktop phone holder with anti-slip silicone cushions and charging cable cutout. Ideal for video calls and study.',
        images: ['https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=600&q=80'],
        price: 229,
        originalPrice: 549,
        stock: 40,
        unit: 'piece',
        rating: 4.8,
        reviewCount: 21,
        tags: ['mobile stand', 'phone holder', 'desktop stand', 'tablet stand', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: '360° Magnetic Car Air Vent & Dashboard Mobile Mount',
        slug: '360-magnetic-car-mobile-mount',
        description: 'Strong N52 neodymium magnets hold heavy phones firmly even on bumpy roads. 360-degree ball rotation for GPS navigation.',
        images: ['https://images.unsplash.com/photo-1616469829941-c7200edec809?auto=format&fit=crop&w=600&q=80'],
        price: 249,
        originalPrice: 599,
        stock: 35,
        unit: 'piece',
        rating: 4.7,
        reviewCount: 18,
        tags: ['car mobile holder', 'magnetic mount', 'car accessory', 'mobile holder', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Ambrane 20000mAh 22.5W Fast Charging Power Bank with Digital Display',
        slug: 'ambrane-20000mah-fast-charging-power-bank',
        description: '22.5W Power Delivery & Quick Charge 3.0 output, dual input, triple output, digital percentage battery display, made in India.',
        images: ['https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?auto=format&fit=crop&w=600&q=80'],
        price: 1899,
        originalPrice: 2999,
        stock: 20,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 34,
        tags: ['power bank', '20000mah', 'ambrane', 'fast charger', 'battery bank', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'SanDisk Ultra 64GB MicroSDXC Class 10 Memory Card (Up to 140MB/s)',
        slug: 'sandisk-ultra-64gb-microsd-card',
        description: 'A1-rated for faster mobile app loading and Full HD video recording. Shockproof, temperature-proof, waterproof, and X-ray-proof.',
        images: ['https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=600&q=80'],
        price: 549,
        originalPrice: 950,
        stock: 50,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 46,
        tags: ['memory card', 'sandisk', 'sd card', '64gb', 'storage', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Dual OTG Type-C & USB 3.0 High-Speed 64GB Metal Flash Drive',
        slug: 'dual-otg-type-c-usb-64gb-flash-drive',
        description: 'Plug and play dual connector metal pen drive to quickly free up storage on your Android smartphone, tablet, and PC.',
        images: ['https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=600&q=80'],
        price: 599,
        originalPrice: 1199,
        stock: 35,
        unit: 'piece',
        rating: 4.8,
        reviewCount: 27,
        tags: ['pen drive', 'otg', 'type-c pendrive', 'usb flash drive', 'storage', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: '9H Tempered Glass Camera Lens Protector (Ring Protection Set)',
        slug: '9h-camera-lens-protector-ring-set',
        description: 'Ultra-thin titanium alloy metal edge with 9H sapphire-grade glass. Night shooting mode AR anti-reflective light ring.',
        images: ['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80'],
        price: 149,
        originalPrice: 349,
        stock: 60,
        unit: 'set',
        rating: 4.7,
        reviewCount: 16,
        tags: ['camera protector', 'lens guard', 'camera glass', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: '7-in-1 Multifunction Electronic Cleaner Kit for Mobile & Earbuds',
        slug: '7-in-1-multifunction-cleaner-kit',
        description: 'Foldable cleaning pen, high-density soft brush, flocking sponge, keycap buckle, and screen cleaner spray for phone and gadgets.',
        images: ['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80'],
        price: 199,
        originalPrice: 499,
        stock: 45,
        unit: 'set',
        rating: 4.8,
        reviewCount: 24,
        tags: ['cleaner kit', 'earbuds cleaner', 'screen cleaner', 'cleaning pen', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'OnePlus 65W Warp / SuperVOOC Type-C Fast Charger with Red Cable',
        slug: 'oneplus-65w-warp-supervooc-charger',
        description: 'Ultra-fast 65W charging for OnePlus, Oppo, and Realme devices. Includes signature heavy-gauge 1m red Type-C cable.',
        images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80'],
        price: 899,
        originalPrice: 1999,
        stock: 30,
        unit: 'set',
        rating: 4.9,
        reviewCount: 37,
        tags: ['oneplus charger', '65w fast charger', 'warp charger', 'supervooc', 'mobile charger', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Apple MFi Certified Braided Fast Charging Lightning Cable (1.2m)',
        slug: 'apple-mfi-certified-braided-lightning-cable',
        description: 'Durable braided nylon Lightning cable with Apple C94 connector chip for iPhone 11/12/13/14 and iPads.',
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
        price: 349,
        originalPrice: 799,
        stock: 50,
        unit: 'piece',
        rating: 4.8,
        reviewCount: 29,
        tags: ['iphone cable', 'lightning cable', 'apple charger', 'mfi cable', 'mobile cable', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Matte Finish Anti-Glare Gaming Tempered Glass (No-Fingerprint 9H)',
        slug: 'matte-finish-anti-glare-gaming-tempered-glass',
        description: 'Frosted matte surface eliminates screen glare and fingerprint grease. Silk-smooth swipe touch response optimized for BGMI and Free Fire gaming.',
        images: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=600&q=80'],
        price: 199,
        originalPrice: 499,
        stock: 80,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 52,
        tags: ['matte tempered glass', 'gaming screen guard', 'anti glare', 'no fingerprint', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'UV Liquid Curved Glass Screen Protector with Mini UV Lamp',
        slug: 'uv-liquid-curved-glass-screen-protector',
        description: 'Liquid optical clear adhesive (LOCA) tempered glass with mini UV curing lamp for edge-to-edge curved screen protection without bubbles.',
        images: ['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80'],
        price: 299,
        originalPrice: 699,
        stock: 40,
        unit: 'set',
        rating: 4.7,
        reviewCount: 25,
        tags: ['uv tempered glass', 'curved glass', 'uv glue screen guard', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Executive Leather Texture Slim Protective Back Cover',
        slug: 'executive-leather-texture-slim-back-cover',
        description: 'Executive faux leather back finish with flexible TPU grip sides. Raised camera bezel protects lens against table scratches.',
        images: ['https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?auto=format&fit=crop&w=600&q=80'],
        price: 249,
        originalPrice: 599,
        stock: 45,
        unit: 'piece',
        rating: 4.8,
        reviewCount: 34,
        tags: ['leather cover', 'phone case', 'luxury mobile case', 'back cover', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: '15W Qi Fast Wireless Magnetic Car Charging Mount (Air Vent Clip)',
        slug: '15w-qi-fast-wireless-magnetic-car-charging-mount',
        description: 'Strong magnetic lock with built-in 15W Qi fast wireless induction charging coil. 360-degree rotation ball mount for car air vents.',
        images: ['https://images.unsplash.com/photo-1616469829941-c7200edec809?auto=format&fit=crop&w=600&q=80'],
        price: 749,
        originalPrice: 1499,
        stock: 25,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 22,
        tags: ['wireless car charger', 'magsafe car mount', 'magnetic charger', 'car mobile holder', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: '10,000mAh Ultra-Slim Magnetic Wireless Power Bank (20W PD Output)',
        slug: '10000mah-ultra-slim-magnetic-wireless-power-bank',
        description: 'Snap-on magnetic wireless power bank with strong magnets and 20W Type-C wired fast charging output. Pocket-friendly slim design.',
        images: ['https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?auto=format&fit=crop&w=600&q=80'],
        price: 1499,
        originalPrice: 2499,
        stock: 20,
        unit: 'piece',
        rating: 4.8,
        reviewCount: 19,
        tags: ['wireless power bank', 'magsafe battery', 'magnetic power bank', 'portable charger', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Hi-Res Type-C to 3.5mm Headphone Jack DAC Audio Adapter',
        slug: 'hi-res-type-c-to-3-5mm-dac-audio-adapter',
        description: 'Built-in digital DAC audio decoding chip (24bit/96kHz) supports microphone calls and music playback on phones without headphone jack.',
        images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80'],
        price: 199,
        originalPrice: 499,
        stock: 60,
        unit: 'piece',
        rating: 4.7,
        reviewCount: 31,
        tags: ['type-c to 3.5mm', 'dac audio adapter', 'headphone converter', 'aux adapter', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: '100W 5A E-Marker Braided Super Fast Type-C to Type-C Cable (1.5m)',
        slug: '100w-5a-e-marker-braided-type-c-to-type-c-cable',
        description: 'Smart E-Marker chip supports up to 100W 20V/5A power delivery for laptops, tablets, and flagship smartphones with fast data transfer.',
        images: ['https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=600&q=80'],
        price: 349,
        originalPrice: 799,
        stock: 40,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 43,
        tags: ['100w cable', 'type-c to type-c', 'e-marker cable', 'fast charging cable', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Waterproof Motorcycle & Cycle Mobile Pouch Mount (Touchscreen Window)',
        slug: 'waterproof-motorcycle-cycle-mobile-pouch-mount',
        description: 'Rainproof sealed zipper mobile pouch with ultra-sensitive touch TPU window, 360-degree handlebar clamp, and sun visor hood.',
        images: ['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80'],
        price: 349,
        originalPrice: 699,
        stock: 35,
        unit: 'piece',
        rating: 4.8,
        reviewCount: 27,
        tags: ['waterproof mobile holder', 'bike mobile pouch', 'cycle phone mount', 'rain cover', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Extendable Wireless Bluetooth Selfie Stick Tripod with Remote Shutter',
        slug: 'extendable-wireless-bluetooth-selfie-stick-tripod',
        description: '3-in-1 folding selfie stick and desktop tripod stand with detachable 10-meter wireless Bluetooth shutter button.',
        images: ['https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=600&q=80'],
        price: 399,
        originalPrice: 899,
        stock: 30,
        unit: 'piece',
        rating: 4.7,
        reviewCount: 38,
        tags: ['selfie stick', 'tripod stand', 'bluetooth remote', 'mobile tripod', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'SanDisk Ultra 128GB MicroSDXC Class 10 High Speed Memory Card',
        slug: 'sandisk-ultra-128gb-microsd-memory-card',
        description: 'Up to 140MB/s transfer speed, A1 app performance rating, waterproof, temperature-proof, shockproof for 4K and Full HD mobile video.',
        images: ['https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=600&q=80'],
        price: 899,
        originalPrice: 1550,
        stock: 35,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 61,
        tags: ['128gb memory card', 'sandisk', 'sd card', 'microsd', 'mobile storage', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Metal Individual Ring Camera Lens Protector for iPhone & Samsung (Set of 3)',
        slug: 'metal-individual-ring-camera-lens-protector',
        description: 'Aviation alloy protective rim with 9H sapphire clear glass. Protects lenses from dust and drops without flash flare.',
        images: ['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80'],
        price: 179,
        originalPrice: 399,
        stock: 55,
        unit: 'set',
        rating: 4.8,
        reviewCount: 23,
        tags: ['camera lens protector', 'lens ring guard', 'camera glass', 'mobile protector', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Heavy-Duty Type-C OTG Metal Adapter Converter (Pack of 2)',
        slug: 'heavy-duty-type-c-otg-metal-adapter-pack-of-2',
        description: 'Zinc alloy plug-and-play USB to Type-C OTG connector for pen drives, keyboards, mouse, and gamepads on Android phones.',
        images: ['https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=600&q=80'],
        price: 99,
        originalPrice: 249,
        stock: 90,
        unit: 'set',
        rating: 4.8,
        reviewCount: 40,
        tags: ['otg adapter', 'type-c otg', 'usb converter', 'pen drive connector', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'Silicone Spiral Cable Wire Protectors & Cord Savers (Set of 6)',
        slug: 'silicone-spiral-cable-wire-protectors-set-of-6',
        description: 'Prevents charging cables from breaking and fraying at bend points. Compatible with iPhone Lightning, Type-C, and micro USB cables.',
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
        price: 69,
        originalPrice: 199,
        stock: 120,
        unit: 'set',
        rating: 4.7,
        reviewCount: 68,
        tags: ['cable protector', 'cord saver', 'wire protector', 'cable guard', 'mobile accessory']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['mobile-accessories']._id,
        name: 'RGB Low-Latency Bluetooth Gaming Wireless Neckband (50ms Low Lag)',
        slug: 'rgb-low-latency-bluetooth-gaming-wireless-neckband',
        description: 'Ultra-responsive 50ms gaming mode with RGB breathing LEDs, vibration call alerts, and up to 30 hours battery backup.',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
        price: 999,
        originalPrice: 1999,
        stock: 25,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 36,
        tags: ['gaming neckband', 'rgb earphones', 'low latency', 'bluetooth neckband', 'mobile audio', 'mobile accessory']
      },

      // Electronics & Gadgets
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['electronics-mobile']._id,
        name: 'boAt Rockerz 255 Pro+ Wireless Neckband',
        slug: 'boat-rockerz-255-pro-plus',
        description: 'Up to 40 Hours Playback, ASAP Charge (10 min = 10 hrs), IPX7 water resistance, magnetic earbuds with deep bass.',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
        price: 1199,
        originalPrice: 1999,
        stock: 20,
        unit: 'piece',
        rating: 4.8,
        reviewCount: 31,
        tags: ['boat', 'earphones', 'bluetooth', 'audio', 'gadgets']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['electronics-mobile']._id,
        name: 'Mi 10000mAh Power Bank 3i (18W Fast Charging)',
        slug: 'mi-10000mah-power-bank-3i',
        description: 'Dual input Type-C & Micro-USB, triple output port, 12 layers circuit protection, metallic finish.',
        images: ['https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?auto=format&fit=crop&w=600&q=80'],
        price: 1299,
        originalPrice: 1799,
        stock: 18,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 19,
        tags: ['powerbank', 'charger', 'mobile accessory', 'xiaomi']
      },
      {
        shop: shop2._id,
        seller: seller2User._id,
        category: catMap['electronics-mobile']._id,
        name: 'Fastrack Reflex Beat+ Fitness Smartwatch',
        slug: 'fastrack-reflex-beat-plus',
        description: '1.69" UltraVU display, 60+ sports modes, 24x7 Heart Rate & SpO2 tracking, 5-day battery life.',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
        price: 1499,
        originalPrice: 2499,
        stock: 12,
        unit: 'piece',
        rating: 4.6,
        reviewCount: 14,
        tags: ['smartwatch', 'fastrack', 'fitness', 'watch']
      },

      // Hardware
      {
        shop: shop4._id,
        seller: seller4User._id,
        category: catMap['hardware-machinery']._id,
        name: 'Bosch GSB 500W Professional Impact Drill Machine',
        slug: 'bosch-gsb-500w-drill',
        description: 'Robust 500 Watt motor with forward/reverse rotation, variable speed switch, suitable for masonry, metal and wood.',
        images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80'],
        price: 3250,
        originalPrice: 4100,
        stock: 8,
        unit: 'set',
        rating: 4.9,
        reviewCount: 20,
        tags: ['bosch', 'drill', 'tools', 'hardware', 'machinery']
      },
      {
        shop: shop4._id,
        seller: seller4User._id,
        category: catMap['hardware-machinery']._id,
        name: 'Havells Fabio 16A Modular Switch & Socket Set',
        slug: 'havells-fabio-switch-socket-set',
        description: 'Pack of 5 heavy-duty 16A sockets with safety shutter, dual-colour polycarbonate front plate.',
        images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'],
        price: 680,
        originalPrice: 850,
        stock: 30,
        unit: 'box',
        rating: 4.7,
        reviewCount: 11,
        tags: ['havells', 'electrical', 'switches', 'hardware']
      },

      // Bike spare / auto item
      {
        shop: shop3._id,
        seller: seller3User._id,
        category: catMap['hardware-machinery']._id,
        name: 'Motul 4T Plus 20W40 4-Stroke Motorcycle Engine Oil (1L)',
        slug: 'motul-4t-plus-20w40-1l',
        description: 'Premium HC-Tech engine oil for all 100cc to 200cc motorbikes. Ensures smooth gear shift and engine protection.',
        images: ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80'],
        price: 365,
        originalPrice: 420,
        stock: 45,
        unit: 'piece',
        rating: 4.9,
        reviewCount: 26,
        tags: ['engine oil', 'bike', 'motul', 'auto garage']
      }
    ];

    const products = await Product.insertMany(productsData);
    console.log(`✓ Seeded ${products.length} Products with Indian Rupee pricing.`);

    // 7. Services
    const servicesData = [
      {
        provider: seller4User._id,
        shop: shop4._id,
        category: catMap['repair-electrician']._id,
        serviceType: 'Electrician',
        title: 'Home Electrical Wiring, MCB & Switchboard Inspection',
        description: 'Comprehensive home electrical troubleshooting, short circuit resolution, MCB installation, and fan/lighting fittings by licensed technician.',
        pricingModel: 'fixed',
        price: 199,
        serviceArea: 'Within 12 km of Latouche Road, Kanpur',
        durationMinutes: 60,
        images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'],
        rating: 4.9,
        reviewCount: 47
      },
      {
        provider: seller4User._id,
        shop: shop4._id,
        category: catMap['plumbing-labour-services']._id,
        serviceType: 'Plumber',
        title: 'Complete Bathroom Tap, Cistern & Pipe Leakage Repair',
        description: 'Fast doorstep plumbing service for leaking pipes, overhead water tank float valve, mixer replacement, and drain unblocking.',
        pricingModel: 'fixed',
        price: 249,
        serviceArea: 'Kanpur City (Civil Lines, Arya Nagar, Swaroop Nagar)',
        durationMinutes: 45,
        images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'],
        rating: 4.8,
        reviewCount: 38
      },
      {
        provider: seller3User._id,
        shop: shop3._id,
        category: catMap['auto-garage-services']._id,
        serviceType: 'Garage & Vehicle Repair',
        title: 'Complete Two-Wheeler (Bike/Scooter) Full General Service',
        description: 'Full washing, oil change, brake cleaning, spark plug service, carburettor tuning, chain lubricate and 21-point safety inspection.',
        pricingModel: 'fixed',
        price: 399,
        serviceArea: 'Abu Highway, Deesa Highway, Aroma Circle area',
        durationMinutes: 90,
        images: ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80'],
        rating: 4.9,
        reviewCount: 64
      },
      {
        provider: seller2User._id,
        shop: shop2._id,
        category: catMap['repair-electrician']._id,
        serviceType: 'AC & Appliance Repair',
        title: 'Split / Window AC Deep Jet Pump Service & Gas Check',
        description: 'High-pressure foam jet water wash of indoor & outdoor coils, filter cleaning, cooling efficiency and refrigerant pressure measurement.',
        pricingModel: 'fixed',
        price: 549,
        serviceArea: 'All areas of Palanpur (385001)',
        durationMinutes: 60,
        images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'],
        rating: 4.8,
        reviewCount: 22
      },
      {
        provider: seller2User._id,
        shop: shop2._id,
        category: catMap['repair-electrician']._id,
        serviceType: 'Mobile & Device Repair',
        title: 'Doorstep Mobile Screen, Battery & Charging Port Repair',
        description: 'Certified technician repairs cracked mobile screens, swollen batteries, loose charging ports, and microphone issues right at your doorstep in Palanpur with warranty.',
        pricingModel: 'fixed',
        price: 349,
        serviceArea: 'All areas of Palanpur (385001)',
        durationMinutes: 45,
        images: ['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80'],
        rating: 4.9,
        reviewCount: 41
      },
      {
        provider: seller2User._id,
        shop: shop2._id,
        category: catMap['repair-electrician']._id,
        serviceType: 'Mobile Accessories & Lamination',
        title: 'Doorstep UV Curved Glass Pasting & Full Body Lamination',
        description: 'Expert bubble-free UV liquid glue tempered glass application for curved screens and 360-degree transparent scratch-resistant body lamination at your home or shop.',
        pricingModel: 'fixed',
        price: 199,
        serviceArea: 'Palanpur City & GIDC Area',
        durationMinutes: 30,
        images: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=600&q=80'],
        rating: 4.8,
        reviewCount: 29
      }
    ];

    const services = await ServiceListing.insertMany(servicesData);
    console.log(`✓ Seeded ${services.length} Service offerings.`);

    // 8. Vehicle Listings
    const vehiclesData = [
      {
        seller: seller5User._id,
        shop: shop5._id,
        title: 'Maruti Suzuki Swift VXi (2021) — Mint Condition',
        vehicleType: 'car',
        make: 'Maruti Suzuki',
        model: 'Swift',
        variant: 'VXi 1.2 Petrol',
        year: 2021,
        condition: 'used',
        mileageKm: 26500,
        fuelType: 'Petrol',
        transmission: 'Manual',
        askingPrice: 565000,
        photos: [
          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80'
        ],
        location: { city: 'Palanpur', area: 'Aroma Circle', state: 'Gujarat', pincode: '385001' },
        ownership: '1st Owner',
        description: 'Single-handed driven Swift VXi in Magma Grey. Insurance valid till Nov 2026. Complete authorized Maruti service records, chilled AC, new seat covers.',
        isApproved: true,
        isActive: true
      },
      {
        seller: seller5User._id,
        shop: shop5._id,
        title: 'Royal Enfield Classic 350 Dual-Channel ABS (2022)',
        vehicleType: 'bike',
        make: 'Royal Enfield',
        model: 'Classic 350',
        variant: 'Halcyon Green Dual ABS',
        year: 2022,
        condition: 'used',
        mileageKm: 12400,
        fuelType: 'Petrol',
        transmission: 'Manual',
        askingPrice: 172000,
        photos: [
          'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80'
        ],
        location: { city: 'Palanpur', area: 'Station Road', state: 'Gujarat', pincode: '385001' },
        ownership: '1st Owner',
        description: 'Showroom condition Classic 350 with all original accessories: leg guard, sump guard, touring mirrors, and zero depreciation insurance.',
        isApproved: true,
        isActive: true
      },
      {
        seller: seller5User._id,
        shop: shop5._id,
        title: 'Honda Activa 6G DLX (2023) — Low Mileage',
        vehicleType: 'scooter',
        make: 'Honda',
        model: 'Activa 6G',
        variant: 'Deluxe LED Headlamp',
        year: 2023,
        condition: 'used',
        mileageKm: 7800,
        fuelType: 'Petrol',
        transmission: 'Automatic',
        askingPrice: 71000,
        photos: [
          'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80'
        ],
        location: { city: 'Palanpur', area: 'Delhi Gate', state: 'Gujarat', pincode: '385001' },
        ownership: '1st Owner',
        description: 'Practically brand new Activa 6G in Pearl Siren Blue. Female doctor owned, serviced only at Authorized Honda workshop. Great mileage of 52 km/l.',
        isApproved: true,
        isActive: true
      }
    ];

    const vehicles = await VehicleListing.insertMany(vehiclesData);
    console.log(`✓ Seeded ${vehicles.length} Vehicle listings.`);

    // 9. Initial Reviews
    await Review.create({
      user: customerUser._id,
      targetType: 'product',
      targetId: products[0]._id,
      targetModel: 'Product',
      rating: 5,
      title: 'Fresh and soft rotis!',
      comment: 'Sharma Kirana always delivers original packed wheat flour. Received delivery in under 45 minutes.',
      isVerifiedPurchase: true,
      isApproved: true
    });

    await Review.create({
      user: customerUser._id,
      targetType: 'shop',
      targetId: shop1._id,
      targetModel: 'Shop',
      rating: 5,
      title: 'Best local grocery store in Palanpur',
      comment: 'Friendly behaviour and fair prices. Highly recommended local dukaan!',
      isVerifiedPurchase: true,
      isApproved: true
    });

    console.log('--- ANMOL STORE Database Seeding Completed Successfully! ---');
  } catch (err) {
    console.error('Fatal Seeding Error:', err);
    throw err;
  }
}

// Run standalone if executed directly
if (process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    await disconnectDB();
    process.exit(0);
  })();
}
