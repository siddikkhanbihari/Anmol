# ANMOL STORE — Production Deployment Guide

## Production Architecture Overview

ANMOL STORE is structured for modern cloud deployment:
1. **Frontend**: Pure modern vanilla ES modules, static CSS/HTML assets, easily servable via Nginx, AWS S3 + CloudFront, Vercel, or directly through Express.
2. **Backend**: Stateless Node.js / Express.js REST API with cluster/PM2 process management.
3. **Database**: MongoDB Atlas replica set with automated backups, VPC peering, and IP whitelisting.

---

## 1. MongoDB Atlas Setup

1. Create an account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create an **M10 or higher dedicated cluster** in an AWS / GCP India region (e.g., `ap-south-1` Mumbai) for low latency.
3. Under **Database Access**, create a user with `readWriteAnyDatabase` role.
4. Under **Network Access**, whitelist your production server IP addresses (or `0.0.0.0/0` temporarily).
5. Copy your connection string into `MONGODB_URI`:
   ```env
   MONGODB_URI=mongodb+srv://anmol_admin:<password>@cluster0.abcde.mongodb.net/anmol_store?retryWrites=true&w=majority
   ```

---

## 2. Production Environment Variables

Ensure all sensitive keys are set via production environment manager (do not commit secrets to Git):

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=<generate-strong-random-64-char-string>
JWT_REFRESH_SECRET=<generate-strong-random-64-char-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
INITIAL_ADMIN_EMAIL=admin@anmolstore.in
INITIAL_ADMIN_PASSWORD=<strong-admin-password>
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
```

---

## 3. Server Deployment (Ubuntu / AWS EC2 / DigitalOcean)

### Install Node.js 20 LTS & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

### Clone and Install
```bash
git clone <your-repository-url> /var/www/anmol-store
cd /var/www/anmol-store/backend
npm install --omit=dev
```

### Run First-Time Setup
```bash
node scripts/create-admin.js
```

### Start with PM2 Process Manager
```bash
pm2 start src/server.js --name "anmol-backend" -i max
pm2 save
pm2 startup
```

---

## 4. Reverse Proxy with Nginx & SSL (Certbot)

Configure `/etc/nginx/sites-available/anmolstore.in`:

```nginx
server {
    server_name anmolstore.in www.anmolstore.in;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable SSL:
```bash
sudo certbot --nginx -d anmolstore.in -d www.anmolstore.in
```

---

## 5. Security & Verification Checklist

- [x] Passwords salted and hashed with bcrypt (cost factor 10)
- [x] JWT access tokens expire in 15 minutes
- [x] Refresh tokens stored in HttpOnly, Secure SameSite cookies
- [x] Role-Based Access Control enforced on backend routes
- [x] Seller order isolation verified (sellers can only view their own fulfillment orders)
- [x] Rate limiting active on all API and authentication endpoints
- [x] Content Security Policy and Helmet headers active
- [x] Inputs sanitized and MongoDB injection prevented
- [x] Sensitive stack traces hidden in production mode
