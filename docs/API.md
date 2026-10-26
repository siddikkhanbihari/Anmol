# ANMOL STORE — REST API Documentation (v1)

Base URL: `http://localhost:5000/api/v1`

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register customer account | Public |
| `POST` | `/auth/register-seller` | Register seller & digital storefront | Public |
| `POST` | `/auth/login` | Authenticate customer/seller/admin | Public |
| `POST` | `/auth/refresh` | Refresh access token using cookie | Public / Cookie |
| `POST` | `/auth/logout` | Revoke session & clear cookie | Public |
| `GET` | `/auth/me` | Fetch active user, shop & profile | Yes (Bearer) |
| `PATCH` | `/auth/profile` | Update user name, phone, avatar | Yes (Bearer) |
| `POST` | `/auth/forgot-password` | Request password reset token | Public |
| `POST` | `/auth/reset-password` | Reset password using valid token | Public |

---

## 2. Shops & Storefronts (`/shops`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/shops` | List active shops (filters: `category`, `city`, `search`, `sort`, `page`) | Public |
| `GET` | `/shops/:slug` | View individual shop details, products & reviews | Public |
| `GET` | `/shops/mine` | View authenticated seller's shop | Seller |
| `PATCH` | `/shops/:id` | Update shop details, hours, address, charges | Seller (Owner) / Admin |

---

## 3. Products & Catalog (`/products`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/products` | List catalog (filters: `category`, `search`, `minPrice`, `maxPrice`, `rating`, `inStock`, `sort`) | Public |
| `GET` | `/products/:id` | View product details, gallery, reviews, related | Public |
| `GET` | `/products/seller/mine` | List products for current seller | Seller |
| `POST` | `/products` | Create new product in seller shop | Seller / Admin |
| `PATCH` | `/products/:id` | Update product details, stock, prices | Seller (Owner) / Admin |
| `DELETE` | `/products/:id` | Delete / archive product | Seller (Owner) / Admin |

---

## 4. Shopping Cart (`/cart`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/cart` | Get current user's cart populated with products & shops | Customer / Admin |
| `POST` | `/cart/items` | Add product to cart (validates inventory stock) | Customer / Admin |
| `PATCH` | `/cart/items/:id` | Update item quantity in cart | Customer / Admin |
| `DELETE` | `/cart/items/:id` | Remove item from cart | Customer / Admin |
| `DELETE` | `/cart` | Clear entire cart | Customer / Admin |

---

## 5. Orders & Fulfillment (`/orders`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/orders` | Place multi-seller order with server inventory decrement | Customer |
| `GET` | `/orders/mine` | List customer's orders | Customer |
| `GET` | `/orders/seller` | List orders assigned to seller's shop | Seller |
| `GET` | `/orders/:id` | Order details with seller fulfilment groups | Customer / Seller / Admin |
| `PATCH` | `/orders/seller/:id/status`| Update status (`accepted`, `shipped`, `delivered`, `rejected`) | Seller / Admin |
| `PATCH` | `/orders/:id/cancel` | Cancel order prior to dispatch | Customer |

---

## 6. On-Demand Services & Bookings (`/services`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/services` | List service offerings (filters: `serviceType`, `search`) | Public |
| `GET` | `/services/:id` | View service details & technician profile | Public |
| `POST` | `/services` | List new service offering | Seller / Admin |
| `POST` | `/services/bookings` | Book service appointment with date & slot | Customer |
| `GET` | `/services/bookings/mine` | Customer's service booking history | Customer |
| `GET` | `/services/bookings/provider`| Provider's incoming booking requests | Seller / Admin |
| `PATCH` | `/services/bookings/:id/status`| Confirm or complete service booking | Seller / Admin |

---

## 7. Vehicles & Buyer Inquiries (`/vehicles`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/vehicles` | List pre-owned cars, bikes & scooters | Public |
| `GET` | `/vehicles/:id` | View vehicle specs, ownership & seller details | Public |
| `POST` | `/vehicles` | List vehicle for sale | Seller / Admin |
| `POST` | `/vehicles/inquiries` | Submit vehicle purchase / test drive inquiry | Customer |
| `GET` | `/vehicles/inquiries/mine` | Customer's vehicle inquiry history | Customer |
| `GET` | `/vehicles/inquiries/seller` | Seller's received buyer inquiries | Seller / Admin |

---

## 8. Customer Management (`/users`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/users/addresses` | Get saved delivery addresses | Customer |
| `POST` | `/users/addresses` | Add delivery address | Customer |
| `PATCH` | `/users/addresses/:id` | Update address | Customer |
| `DELETE` | `/users/addresses/:id`| Remove address | Customer |
| `GET` | `/users/notifications` | Get in-app notifications | Customer / Seller |
| `PATCH` | `/users/notifications/:id/read` | Mark notification as read | Customer / Seller |
| `PATCH` | `/users/notifications/read-all` | Mark all notifications read | Customer / Seller |
| `POST` | `/users/support` | Submit customer support ticket | Public / Optional Auth |

---

## 9. Reviews & Ratings (`/reviews`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/reviews` | Get reviews by target (`targetType`, `targetId`) | Public |
| `POST` | `/reviews` | Submit product, shop, or service review | Customer |

---

## 10. Admin Control Center (`/admin`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/admin/overview` | Platform KPI statistics (GMV, orders, sellers) | Admin Only |
| `GET` | `/admin/sellers` | List all registered sellers | Admin Only |
| `PATCH` | `/admin/sellers/:id/status` | Approve / Reject / Suspend seller shop | Admin Only |
| `GET` | `/admin/orders` | Monitor all marketplace orders | Admin Only |
| `GET` | `/admin/users` | List users & roles | Admin Only |
| `PATCH` | `/admin/users/:id/status` | Suspend or activate user account | Admin Only |
| `GET` | `/admin/settings` | Get platform policies | Admin Only |
| `PATCH` | `/admin/settings` | Update policies (free registration, COD, etc.) | Admin Only |
| `GET` | `/admin/audit-logs` | Stream administrative audit trail | Admin Only |
