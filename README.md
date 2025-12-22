# 💎 AssetVerse - Backend Server
> A comprehensive backend API for managing corporate assets, employees, and requests with JWT authentication, role-based access control, and Stripe payment integration.

## 🌐 Live URL

**Production Server**: [https://asset-verse-server-mu.vercel.app](https://asset-verse-server-mu.vercel.app)

---

## ✨ Key Features

### **Authentication & Authorization**
- ✅ JWT-based authentication with 7-day token expiry
- ✅ Role-based access control (HR Manager / Employee)
- ✅ Secure password hashing with bcryptjs
- ✅ Protected routes with middleware (`verifyToken`, `verifyHR`)

### **Asset Management**
- ✅ CRUD operations for assets (Create, Read, Update, Delete)
- ✅ Asset inventory tracking with quantity management
- ✅ Asset types: Returnable / Non-returnable
- ✅ Image upload support for asset photos
- ✅ Real-time availability tracking

### **Employee Management**
- ✅ Employee affiliation system (link employees to HR companies)
- ✅ Package-based employee limits (5, 10, 20+ employees)
- ✅ Team member listing per company
- ✅ Employee profile management

### **Request System**
- ✅ Asset request workflow (Pending → Approved/Rejected)
- ✅ Return request system for returnable assets
- ✅ Request history tracking with dates
- ✅ Email notifications for request status

### **Pagination**
- ✅ Server-side pagination on all major routes
- ✅ Default page size: 10 items
- ✅ Query parameters: `?page=1&limit=10`
- ✅ Response includes: `{ data: [], pagination: { page, limit, total, pages } }`

### **Analytics**
- ✅ Asset distribution charts (Returnable vs Non-returnable)
- ✅ Top 5 most requested assets
- ✅ Real-time statistics for HR dashboard

### **Payment Integration**
- ✅ Stripe payment processing
- ✅ Package upgrade system (Basic → Standard → Premium)
- ✅ Payment intent creation and confirmation
- ✅ Subscription management

### **Notice Board**
- ✅ Company-wide announcements
- ✅ HR-to-Employee communication
- ✅ Priority levels for notices

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | Latest | Runtime environment |
| Express.js | 4.19.2 | Web framework |
| MongoDB | 6.6.0 | Database (Native Driver) |
| JWT | 9.0.2 | Authentication |
| bcryptjs | 2.4.3 | Password hashing |
| Stripe | 15.12.0 | Payment processing |
| CORS | 2.8.5 | Cross-origin requests |
| dotenv | 16.4.5 | Environment variables |

---

## 📦 NPM Packages Used

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",      // Password hashing
    "cors": "^2.8.5",           // Enable CORS
    "dotenv": "^16.4.5",        // Environment variables
    "express": "^4.19.2",       // Web framework
    "jsonwebtoken": "^9.0.2",   // JWT authentication
    "mongodb": "^6.6.0",        // MongoDB driver
    "stripe": "^15.12.0"        // Payment processing
  }
}
```

---

## 🚀 Setup Instructions

### **1. Clone the Repository**
```bash
git clone https://github.com/cs-rajat/Asset-Verse-Server.git
cd Asset-Verse-Server
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Configure Environment Variables**
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=production

# Database
DB_URI=mongodb+srv://username:password@cluster.mongodb.net/assetverseDB?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# Stripe Payment
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

### **4. Start the Server**

**Development Mode (with auto-restart):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

Server will run on: `http://localhost:5001`

---

## 🌍 Environment Variables Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port number | `5001` |
| `NODE_ENV` | Environment mode | `production` or `development` |
| `DB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT signing | `min_32_character_secret` |
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_test_...` or `sk_live_...` |
| `CLIENT_URL` | Frontend application URL | `http://localhost:5173` |

### **How to Get MongoDB URI:**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Click "Connect" → "Connect your application"
4. Copy connection string
5. Replace `<username>`, `<password>`, and database name

### **How to Get Stripe Keys:**
1. Create account at [Stripe](https://stripe.com)
2. Go to Developers → API Keys
3. Copy "Secret key" (starts with `sk_test_` for testing)
4. Use `sk_live_` keys for production

---

## 📁 Project Structure

```
Asset-Verse-Server/
├── index.js                 # Main entry point
├── vercel.json             # Vercel deployment config
├── package.json            # Dependencies & scripts
├── .env                    # Environment variables
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   ├── authController.js   # Authentication logic
│   ├── assetController.js  # Asset CRUD operations
│   ├── requestController.js # Request handling
│   └── assignedController.js # Asset assignment
├── middlewares/
│   ├── verifyToken.js      # JWT verification
│   └── verifyHR.js         # HR role verification
├── routes/
│   ├── authRoutes.js       # /api/auth
│   ├── usersRoutes.js      # /api/users
│   ├── assetRoutes.js      # /api/assets
│   ├── requestRoutes.js    # /api/requests
│   ├── assignedRoutes.js   # /api/assigned
│   ├── stripeRoutes.js     # /api/stripe
│   ├── analyticsRoutes.js  # /api/analytics
│   └── noticeRoutes.js     # /api/notices
└── models/
    ├── User.js
    ├── Asset.js
    ├── Request.js
    ├── AssignedAsset.js
    ├── Affiliation.js
    └── Payment.js
```

---

## 🔗 API Endpoints

### **Authentication**
- `POST /api/auth/register/hr` - Register HR Manager
- `POST /api/auth/register/employee` - Register Employee
- `POST /api/auth/login` - Login

### **Assets**
- `GET /api/assets?page=1&limit=10` - Get all assets (paginated)
- `POST /api/assets` - Create asset (HR only)
- `PUT /api/assets/:id` - Update asset (HR only)
- `DELETE /api/assets/:id` - Delete asset (HR only)

### **Requests**
- `GET /api/requests/hr?page=1&limit=10` - Get HR's requests (paginated)
- `POST /api/requests` - Create request
- `PATCH /api/requests/approve/:id` - Approve request (HR only)
- `PATCH /api/requests/reject/:id` - Reject request (HR only)

### **Assigned Assets**
- `GET /api/assigned?page=1&limit=10` - Get employee's assigned assets (paginated)
- `POST /api/assigned` - Direct assignment (HR only)
- `PATCH /api/assigned/return/:id` - Request return

### **Users**
- `GET /api/users/employees?page=1&limit=10` - Get HR's employees (paginated)
- `GET /api/users/affiliations` - Get employee's affiliations
- `GET /api/users/team/:companyName` - Get team members

### **Analytics**
- `GET /api/analytics/assets-distribution` - Asset type distribution
- `GET /api/analytics/top-requested` - Top 5 requested assets

---

## 🚢 Deployment (Vercel)

### **Deploy to Vercel:**
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy to production
npx vercel --prod
```

### **Environment Variables in Vercel:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all variables from `.env` file
3. Redeploy after adding variables

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Rajat Mandal**

---

## 🤝 Support

For issues or questions, please contact the development team or create an issue in the repository.
