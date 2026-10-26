# ANMOL STORE — Premium Local Business Marketplace
> **Primary Tagline:** Aapki Dukaan, Aapka Business, Aapki Pehchaan.  
> **Secondary Tagline:** LOCAL BUSINESS, DIGITAL FUTURE.

ANMOL STORE is a production-oriented, multi-vendor digital marketplace empowering local Indian shop owners, kirana retailers, service specialists, and pre-owned vehicle dealers to build their digital presence and connect directly with local neighbourhood customers.

---

## 🌟 Key Highlights & Architecture

- **True Multi-Vendor Marketplace**: Separate digital storefronts for every merchant with their own products, prices, business information, inventory, and assigned orders.
- **Dedicated Workflows**:
  1. **Shopping Cart & Checkout**: Multi-seller cart grouping, delivery charge transparency, inventory decrement, COD & online payment.
  2. **On-Demand Local Services**: Category discovery (Electrician, Plumber, AC Repair, Bike Garage, Machinery), date & time slot booking, provider status management.
  3. **Certified Vehicles Showcase**: Direct inquiries and test drive scheduling for pre-owned cars, bikes, and scooters.
- **Free Seller Registration Policy**: Zero mandatory upfront charges for local dukaandaars.
- **Role-Based Portals**:
  - **Customer Portal**: Orders tracking with timeline, cancellation, address book, service bookings, vehicle inquiries, reviews.
  - **Seller Hub**: Inventory management, product variants, order fulfillment, service bookings management, storefront customization.
  - **Admin Control Center**: High-level KPIs (GMV, orders, sellers), seller verification & suspension, listing moderation, user management, platform policy configuration, audit logs.
- **Enterprise-Grade Security**: JWT authentication with short-lived access tokens + HttpOnly refresh cookie rotation, bcrypt password hashing, role-based backend authorization, rate limiting, and Helmet headers.
- **Zero-Configuration Standalone Mode**: Automatically runs with an embedded in-memory MongoDB server if no local or Atlas MongoDB is installed, allowing instant startup out of the box!

---

## 🚀 Quick Start (Running in 60 Seconds)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run Seed Script (Populate Demo Dukaans & Products)
```bash
node scripts/seed.js
```

### 3. Launch Development Server
```bash
npm run dev
```

Visit the storefront in your browser:
👉 **[http://localhost:5000/index.html](http://localhost:5000/index.html)**

---

## 🔑 Demo Login Credentials

| Role | Portal URL | Email | Password |
|---|---|---|---|
| **Administrator** | `/admin-login.html` | `admin@anmolstore.in` | `Admin@Anmol2026` |
| **Kirana Seller** (Sharma Kirana) | `/login.html` | `sharma.kirana@anmolstore.in` | `Seller@123` |
| **Customer** | `/login.html` | `customer@anmolstore.in` | `Customer@123` |

---

## 🧪 Automated Testing

Run the automated test suite covering all 22 critical workflows (Authentication, RBAC, stock decrement, seller isolation, services, vehicles):

```bash
cd backend
npm test
```

---

## 📁 Repository Structure

```
anmol/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & JWT configuration
│   │   ├── controllers/     # Express route controllers
│   │   ├── middleware/      # Auth, rate limiter, error handler, multer upload
│   │   ├── models/          # 21 Mongoose models
│   │   ├── routes/          # REST API endpoints (/api/v1)
│   │   ├── utils/           # ApiResponse & formatters
│   │   ├── app.js           # Express app assembly & middlewares
│   │   └── server.js        # Server entry point & auto-seed
│   ├── scripts/
│   │   ├── seed.js          # Full database seeder
│   │   └── create-admin.js  # First-admin provisioning
│   ├── tests/
│   │   └── api.test.js      # Automated test specifications
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── assets/              # Icons and images
│   ├── css/
│   │   ├── variables.css    # Color tokens (#123B70, #2563EB, #F97316)
│   │   ├── base.css         # Typography, buttons, forms, badges, modals
│   │   ├── layout.css       # Header, navigation, announcement bar, footer
│   │   ├── components.css   # Product, shop, service, vehicle cards
│   │   └── responsive.css   # Breakpoints, mobile bottom nav & drawer
│   ├── js/
│   │   ├── config.js        # API endpoints & Indian Rupee currency formatters
│   │   ├── notifications.js # Toast notifications manager
│   │   ├── api.js           # Centralized fetch wrapper with JWT interceptor
│   │   ├── auth.js          # User state & RBAC helpers
│   │   ├── navigation.js    # Location selector & layout hydration
│   │   └── cart.js          # Multi-seller grouped cart manager
│   ├── index.html           # Brand homepage
│   ├── shops.html           # Local shop directory
│   ├── shop-details.html    # Dynamic shop digital storefront
│   ├── products.html        # Product catalog & multi-filter
│   ├── product-details.html # Product gallery, variants & reviews
│   ├── services.html        # On-demand services & booking modal
│   ├── vehicles.html        # Pre-owned cars/bikes & inquiry modal
│   ├── login.html           # Unified customer & seller login
│   ├── register.html        # Customer registration
│   ├── seller-register.html # Free seller onboarding
│   ├── cart.html            # Grouped cart view
│   ├── checkout.html        # Multi-seller checkout & delivery addresses
│   ├── order-confirmation.html
│   ├── customer-dashboard.html
│   ├── seller-dashboard.html
│   ├── seller-products.html
│   ├── seller-orders.html
│   ├── seller-services.html
│   ├── seller-profile.html
│   ├── admin-login.html
│   ├── admin-dashboard.html
│   ├── about.html
│   ├── contact.html
│   ├── privacy.html
│   └── terms.html
├── docs/
│   ├── API.md               # Complete REST API reference
│   ├── SETUP.md             # Local developer instructions
│   └── DEPLOYMENT.md        # Production cloud deployment guide
└── README.md
```

---

## 🇮🇳 Vocal For Local India

**ANMOL STORE — Aapki Dukaan, Aapka Business, Aapki Pehchaan.**  
*Empowering local commerce for a digital future.*
