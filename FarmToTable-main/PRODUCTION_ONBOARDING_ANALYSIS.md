# FarmToTable - Production Onboarding Analysis

**Analysis Date:** February 1, 2025  
**Goal:** Make the project run successfully locally and document all issues.

---

## 1. Project Structure Overview

```
FarmToTable-main/
├── Backend/                 # Node.js + Express API
│   ├── config/              # db.js, logger.js, upstash.js
│   ├── controller/          # Business logic (cart, order, payment, product, user)
│   ├── middleware/          # authMiddleware, rateLimiter, validate
│   ├── model/               # Mongoose schemas (User, Product, Order, Cart)
│   ├── routers/             # API route definitions
│   └── Server.js            # Entry point
├── src/                     # React frontend
│   ├── api/                 # API client (auth, cart, orders, products, axios)
│   ├── components/          # React pages
│   ├── context/             # AuthContext
│   ├── services/             # CartService, PaymentService
│   └── main.jsx
└── package.json             # Frontend (Vite + React)
```

---

## 2. Tech Stack & Versions

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React | ^19.1.1 |
| | Vite | ^7.1.2 |
| | React Router | ^7.9.1 |
| | TailwindCSS | ^3.4.17 |
| | DaisyUI | ^3.9.4 |
| | Axios | ^1.12.2 |
| **Backend** | Node.js | (system) |
| | Express | ^5.1.0 |
| | Mongoose | ^8.18.1 |
| | JWT (jsonwebtoken) | ^9.0.2 |
| | bcrypt | ^6.0.0 |
| | Razorpay | ^2.9.6 |
| | express-validator | ^7.3.1 |
| | mongodb-memory-server | ^11.0.1 |
| | Upstash Redis | ^1.34.9 (optional, not used) |

---

## 3. Configuration Files

### 3.1 Backend `.env` (Required)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URL` | Yes | `mongodb://localhost:27017/farm-to-table` or Atlas SRV |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `PORT` | No | Default: 5000 |
| `FRONTEND_URL` | No | Default: http://localhost:5173 (CORS) |
| `RAZORPAY_KEY_ID` | For payments | From Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | For payments | From Razorpay dashboard |

**Location:** `Backend/.env` (copy from `Backend/.env.example`)

### 3.2 Frontend `.env` (Optional)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (default: http://localhost:5000/api) |
| `VITE_RAZORPAY_KEY_ID` | Razorpay key for checkout UI |
| `VITE_GEMINI_KEY` | Gemini API key for recipe generation |

**Location:** `FarmToTable-main/.env` (root, next to package.json)

### 3.3 Database Connection Logic (`Backend/config/db.js`)

**FIXED:** Previously, when `MONGODB_URL` was an Atlas URL (`mongodb+srv://...`), the code **never connected** because it only handled `localhost` or missing URL. Now:

1. **Atlas/Remote URL** → Connects directly
2. **Localhost URL** → Tries local MongoDB, falls back to in-memory
3. **No URL** → Uses in-memory MongoDB (for quick local dev)

---

## 4. Database Schemas - Issues Found & Fixed

### 4.1 Duplicate Indexes (FIXED)

| Model | Issue | Fix |
|-------|-------|-----|
| **User** | `email` had both `unique: true` and `userSchema.index({ email: 1 })` | Removed explicit index (unique already creates one) |
| **Order** | `orderId` had both `unique: true` and `orderSchema.index({ orderId: 1 })` | Removed explicit index |

### 4.2 Schema Validation

| Model | Field | Status |
|-------|-------|--------|
| User | email (unique), role (enum) | ✅ OK |
| Product | farmerId, name, price, stock, unit | ✅ OK |
| Order | orderId (unique), orderStatus (enum), orderedItems | ✅ OK |
| Cart | userId, items[] | ✅ OK |

### 4.3 Order Model Pre-Update Hook

The `findOneAndUpdate` pre-hook uses `this.getUpdate()` which may behave differently in Mongoose 8. If `updatedAt` or `deliveredAt` don't update correctly, consider using `findOneAndUpdate` with `$set` in the controller instead.

---

## 5. API Routes & Controllers - Issues Found

### 5.1 Critical: Payment Controller (FIXED)

**File:** `Backend/controller/paymentController.js`

| Issue | Severity | Fix Applied |
|-------|----------|-------------|
| Used `status: "Paid"` but Order schema has `orderStatus` with enum `CONFIRMED`, etc. | Critical | Changed to `orderStatus: "CONFIRMED"` |
| `orderedItems` had `productId` as ObjectId; schema expects String | Critical | Added `.toString()` |
| **No Razorpay signature verification** | Security | Added HMAC-SHA256 verification |
| Used `orderId: razorpay_order_id` (Razorpay format) | Minor | Generate internal `ORD_xxx` format |

### 5.2 Imports & Exports

All controllers and routes have correct imports. No missing or incorrect imports detected.

### 5.3 Error Handling

Controllers use try-catch and return appropriate status codes. No unhandled promise rejections found.

---

## 6. Why the Project May Fail / Crash

### 6.1 Code Issues (Fixed)

| Issue | Symptom | Fix |
|-------|---------|-----|
| **db.js** – Atlas URL never connected | "Operation buffering timed out" when using MongoDB Atlas | Added explicit connect for non-localhost URLs |
| **paymentController** – Order schema mismatch | "Order validation failed" on payment verify | Fixed field names and types |
| **package.json** – `server.js` vs `Server.js` | "Cannot find module" on Linux/Mac | Updated scripts to `Server.js` |
| **App.jsx** – `getNewOrdersCount` used `o.status === "New"` | Badge always 0 | Changed to `orderStatus === "CONFIRMED"` |

### 6.2 Environment / Network Issues (Not Code)

| Issue | Symptom | Solution |
|-------|---------|-----------|
| **No `.env` file** | "Missing required environment variables" | Copy `Backend/.env.example` to `Backend/.env` |
| **MongoDB not running locally** | Connection timeout | App falls back to in-memory DB automatically |
| **Wrong JWT_SECRET** | "Token is not valid" | Ensure same secret in .env |
| **CORS** | "Not allowed by CORS" | Add your frontend URL to `FRONTEND_URL` or allowed origins in Server.js |
| **Razorpay keys invalid** | Payment fails | Use test keys from Razorpay dashboard |

### 6.3 Unused / Optional

- **Upstash Redis** – Rate limiter middleware exists but is **never applied** to any route. No crash; just unused.
- **Gemini API** – Recipe generation requires `VITE_GEMINI_KEY`. Without it, feature returns a message; no crash.

---

## 7. Database Connection Troubleshooting

### If MongoDB Atlas Connection Fails

1. **Connection string format:**
   ```
   mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/farm-to-table?retryWrites=true&w=majority
   ```

2. **Check:**
   - Username/password URL-encoded (e.g. `@` → `%40`)
   - IP whitelist: Add `0.0.0.0/0` for dev or your IP
   - Cluster is running (Atlas dashboard)
   - Network access allows your IP

3. **DNS/SRV:** Atlas uses SRV records. Ensure your network allows DNS resolution.

4. **Credentials:** Create a DB user in Atlas with read/write permissions.

---

## 8. Step-by-Step Guide to Run Locally

### Prerequisites

- Node.js 18+ 
- (Optional) MongoDB running locally, or use in-memory fallback

### Backend

```bash
cd FarmToTable-main/Backend

# 1. Install dependencies
npm install

# 2. Create .env (copy from example)
copy .env.example .env   # Windows
# cp .env.example .env  # Linux/Mac

# 3. Edit .env - set at minimum:
#    MONGODB_URL=mongodb://localhost:27017/farm-to-table
#    JWT_SECRET=any-random-string-for-dev

# 4. Start server
npm start
# Or for dev with auto-reload:
npm run dev
```

**Expected output:** `Server running on PORT: 5000` and `MongoDB connected`

### Frontend

```bash
cd FarmToTable-main

# 1. Install dependencies
npm install

# 2. (Optional) Create .env for API URL
#    VITE_API_URL=http://localhost:5000/api

# 3. Start dev server
npm run dev
```

**Expected:** App at `http://localhost:5173`

### Quick Test

1. Open http://localhost:5173
2. Sign up as customer or farmer
3. Add products (as farmer) or add to cart (as customer)
4. Checkout (Razorpay test mode if keys are set)

---

## 9. Critical vs Warnings Summary

### Critical (Must Fix) – DONE

- [x] db.js – Connect to Atlas when URL is remote
- [x] paymentController – Order schema alignment + signature verification
- [x] Duplicate indexes in User and Order models
- [x] package.json – Server.js case for Linux
- [x] App.jsx – getNewOrdersCount status field

### Warnings (Optional Improvements)

| Item | Location | Recommendation |
|------|----------|----------------|
| Hardcoded Razorpay key | CartPage.jsx:95 | Use `import.meta.env.VITE_RAZORPAY_KEY_ID` |
| Rate limiter unused | middleware/rateLimiter.js | Apply to login/signup/payment routes |
| No pagination | productController, orderController | Add `?page=&limit=` for large datasets |
| Order pre-update hook | Order.js | Verify Mongoose 8 compatibility |
| Gemini API malformed | gemini.js | Remove stray markdown backticks if present |

---

## 10. Best Practices (After Project Runs)

1. **Security:** Use strong `JWT_SECRET` in production; never commit `.env`
2. **Razorpay:** Use live keys only in production; verify webhooks
3. **MongoDB:** Use Atlas with IP whitelist; enable backup
4. **CORS:** Restrict `FRONTEND_URL` to your actual domain
5. **Logging:** Replace `console.log` with Winston (already configured)
6. **Validation:** express-validator is used for products; add for users, cart, orders
7. **Tests:** Add unit tests for controllers and integration tests for API
8. **Pagination:** Implement for products and orders
9. **Error boundaries:** Add React error boundaries for better UX
10. **API docs:** Consider Swagger/OpenAPI for API documentation

---

## Summary

The project **runs successfully** with the applied fixes. The main causes of failure were:

1. **Database:** Atlas URLs were never connected (logic bug in db.js)
2. **Payment:** Order creation used wrong schema fields and lacked signature verification
3. **Platform:** `server.js` vs `Server.js` can break on Linux
4. **Data:** `getNewOrdersCount` used deprecated `status` field

Follow the step-by-step guide above to run the project locally. Use `.env.example` files as templates for environment configuration.
