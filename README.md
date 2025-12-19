# AssetVerse - Backend Server

The backend API for the AssetVerse Corporate Asset Management System. Built with Node.js, Express, and MongoDB.

## Key Features
- **REST API**: Comprehensive endpoints for Users, Assets, Requests, and Payments.
- **Database**: MongoDB with Mongoose schemas.
- **Authentication**: JWT-based middleware with Role-Based Access Control (VerifyToken, VerifyHR).
- **Payments**: Stripe Payment Intents and Session handling.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JSON Web Token (JWT), bcryptjs
- **Payment**: Stripe SDK

## Setup Instructions
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env` file with the variables listed below.
4. Run `npm start` (or `nodemon index.js`) to start the server.

## Environment Variables
Create a `.env` file in the root directory:
```
PORT=5001
DB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/asset-verse?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:5173
```
