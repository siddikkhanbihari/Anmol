# ANMOL STORE — Local Development & Setup Guide

## Requirements
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **NPM**: v9.0.0 or higher
- **MongoDB**: Optional! Zero-configuration embedded In-Memory MongoDB Server is included automatically out-of-the-box, or you can provide your own local/Atlas MongoDB connection URI.

---

## Quick Start (3 Steps)

### Step 1: Install Backend Dependencies
Open PowerShell or your terminal in the project directory:

```bash
cd backend
npm install
```

### Step 2: Seed Initial Catalog & Create Admin
Run the automated seed script to populate sample Kirana shops, electronics retailers, garage services, vehicle listings, and initial user accounts:

```bash
node scripts/seed.js
```

### Step 3: Start the Backend Server
```bash
npm run dev
```
*(Alternatively, `npm start`)*

The server will display:
```
====================================================
  ANMOL STORE — Premium Local Business Marketplace  
  "Aapki Dukaan, Aapka Business, Aapki Pehchaan"    
  LOCAL BUSINESS, DIGITAL FUTURE                    
====================================================
✓ Backend API server running on port: 5000
✓ API Base: http://localhost:5000/api/v1
✓ Storefront: http://localhost:5000/index.html
====================================================
```

Open your browser to:
👉 **http://localhost:5000/index.html**

---

## Pre-Configured Demo Accounts

All demo accounts are seeded and ready to use immediately:

### 1. Platform Administrator
- **Login URL**: `http://localhost:5000/admin-login.html`
- **Email**: `admin@anmolstore.in`
- **Password**: `Admin@Anmol2026`
- **Role**: `admin` (Access to overview KPIs, seller approvals, user controls, platform policies)

### 2. Verified Kirana Seller (Sharma Kirana & General Store)
- **Login URL**: `http://localhost:5000/login.html`
- **Email**: `sharma.kirana@anmolstore.in`
- **Password**: `Seller@123`
- **Role**: `seller` (Product inventory, order fulfillment, shop profile)

### 3. Customer Buyer
- **Login URL**: `http://localhost:5000/login.html`
- **Email**: `customer@anmolstore.in`
- **Password**: `Customer@123`
- **Role**: `customer` (Cart checkout, order tracking, address book, bookings)

---

## Running Automated Tests

To run the complete automated test suite (verifying authentication, RBAC, inventory validation, seller order isolation, services, and vehicles):

```bash
cd backend
npm test
```

All 22 test specifications will execute and report test passes with zero failures.

---

## Database Configuration Options (`.env`)

In `backend/.env`:
- **Default zero-setup mode (Embedded MongoDB Memory Server)**:
  ```env
  MONGODB_URI=memory
  ```
- **Local MongoDB daemon**:
  ```env
  MONGODB_URI=mongodb://127.0.0.1:27017/anmol_store
  ```
- **MongoDB Atlas Cloud Cluster**:
  ```env
  MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/anmol_store?retryWrites=true&w=majority
  ```
