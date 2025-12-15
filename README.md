# AssetVerse Server

A comprehensive B2B HR & Asset Management System backend built with Node.js, Express, and MongoDB.

## 🚀 Live URL
[Add your deployed server URL here]

## 📋 Project Purpose
AssetVerse is a digital platform that helps companies efficiently manage their physical assets (laptops, keyboards, chairs, etc.) and track which employee has which equipment. It streamlines the entire asset management process for HR departments and employees.

## ✨ Key Features

### Authentication & Authorization
- JWT-based authentication with secure token management
- Role-based access control (HR Manager & Employee roles)
- Password hashing with bcrypt
- Separate registration flows for HR and Employees

### Asset Management
- CRUD operations for company assets
- Real-time inventory tracking with available quantities
- Asset categorization (Returnable/Non-returnable)
- Server-side pagination for large datasets
- Image upload support via URLs

### Request Workflow
- Employee asset request system
- HR approval/rejection workflow
- Automatic affiliation creation on first request approval
- Package limit enforcement
- Asset assignment tracking

### Employee & Affiliation Management
- Auto-affiliation when HR approves first request
- Multi-company support for employees
- Team member visibility per company
- Employee limit tracking per HR package

### Payment Integration
- Stripe Checkout integration for package upgrades
- Three-tier subscription model (Basic, Standard, Premium)
- Immediate package limit updates after successful payment
- Payment history tracking

### Analytics & Reporting
- Pie chart data: Returnable vs Non-returnable assets distribution
- Bar chart data: Top 5 most requested assets
- Real-time aggregation using MongoDB pipelines

### Additional Features
- Asset return workflow for returnable items
- Profile management for all users
- Birthday tracking for employees
- Request history with status tracking

## 📦 npm Packages Used

### Core Dependencies
- **express** (^4.19.2) - Web application framework
- **mongodb** (^6.6.0) - MongoDB native driver
- **jsonwebtoken** (^9.0.2) - JWT token generation and verification
- **bcryptjs** (^2.4.3) - Password hashing
- **dotenv** (^16.4.5) - Environment variable management
- **cors** (^2.8.5) - Cross-origin resource sharing
- **stripe** (^15.12.0) - Payment processing

### Development Dependencies
- **nodemon** - Auto-restart server during development

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- Stripe account for payment processing

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Asset-Verse-Server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your credentials:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   DB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Server will run on**
   ```
   http://localhost:5000
   ```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port number | Yes |
| `CLIENT_URL` | Frontend application URL for CORS and redirects | Yes |
| `DB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT token signing | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret API key for payments | Yes |

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register/hr` - Register as HR Manager
- `POST /register/employee` - Register as Employee
- `POST /login` - User login
- `POST /jwt` - Generate JWT token

### User Routes (`/api/users`)
- `GET /me` - Get current user profile (Protected)
- `PATCH /me` - Update user profile (Protected)
- `GET /affiliations` - Get employee's company affiliations (Protected)
- `GET /employees` - Get HR's employee list (Protected, HR only)
- `GET /team/:companyName` - Get team members by company (Protected)

### Asset Routes (`/api/assets`)
- `POST /` - Add new asset (Protected, HR only)
- `GET /` - Get assets with pagination (Protected)

### Request Routes (`/api/requests`)
- `POST /` - Create asset request (Protected)
- `GET /hr` - Get pending requests for HR (Protected, HR only)
- `PATCH /approve/:id` - Approve request (Protected, HR only)
- `PATCH /reject/:id` - Reject request (Protected, HR only)

### Assigned Assets Routes (`/api/assigned`)
- `GET /` - Get assigned assets with pagination (Protected)
- `PATCH /return/:id` - Return asset (Protected)

### Analytics Routes (`/api/analytics`)
- `GET /assets-distribution` - Get asset distribution data for pie chart (Protected, HR only)
- `GET /top-requested` - Get top 5 requested assets for bar chart (Protected, HR only)

### Payment Routes (`/api/stripe`)
- `POST /create-session` - Create Stripe checkout session (Protected, HR only)
- `POST /payment-success` - Handle successful payment (Protected)

## 🗄️ Database Collections

### users
- Stores HR managers and employees
- Fields: name, email, password, role, companyName, packageLimit, etc.

### assets
- Company assets inventory
- Fields: productName, productImage, productType, productQuantity, availableQuantity, hrEmail

### requests
- Asset request records
- Fields: assetId, requesterEmail, hrEmail, requestStatus, requestDate, approvalDate

### assignedAssets
- Assigned assets tracking
- Fields: assetId, employeeEmail, companyName, assignmentDate, status

### employeeAffiliations
- Employee-company relationships
- Fields: employeeEmail, hrEmail, companyName, affiliationDate, status

### payments
- Payment transaction records
- Fields: hrEmail, packageName, amount, transactionId, paymentDate, status

## 🔒 Security Features

- Password hashing using bcrypt
- JWT token-based authentication
- Role-based access control middleware
- Secure environment variable management
- CORS configuration for cross-origin requests
- Input validation and error handling

## 🚀 Deployment

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Configure environment variables in Vercel dashboard

### Deploy to Render/Railway
1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically on push

## 🧪 Testing

### Test Accounts
- **HR Manager**: hr@testcompany.com / password123
- **Employee**: employee@test.com / password123

## 📝 Notes

- Server uses Native MongoDB Driver (not Mongoose)
- All routes require JWT authentication (except auth routes)
- Package limits are enforced during request approval
- Assets are automatically assigned when requests are approved
- Multi-company support allows employees to work with multiple HRs

## 👨‍💻 Developer

[Your Name]
[Your Email]
[GitHub Profile]

## 📄 License

ISC
