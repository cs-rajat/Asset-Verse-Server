import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import assetsRoutes from "./routes/assetRoutes.js";
import requestsRoutes from "./routes/requestRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import paymentsRoutes from "./routes/stripeRoutes.js";
import assignedRoutes from "./routes/assignedRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// Middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.get("/", (req, res) => res.send("AssetVerse Server Running"));

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/assets", assetsRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/stripe", paymentsRoutes);
app.use("/api/assigned", assignedRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/notices", noticeRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  console.log(`❌ 404 - Not Found: [${req.method}] ${req.url}`);
  res.status(404).send({ msg: "Route not found" });
});

// Start server (only for local development)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    connectDB().then(() => console.log("✅ MongoDB Connected Locally"));
    console.log("✅ Server running on port", PORT);
  });
}

// Export for Vercel serverless
export default app;
