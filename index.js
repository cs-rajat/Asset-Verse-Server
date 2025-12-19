import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.get("/", (req, res) => res.send("AssetVerse Server Running"));

// Connect to MongoDB first, then import and use routes
connectDB().then(async () => {
  // Import routes after DB connection
  const { default: authRoutes } = await import("./routes/authRoutes.js");
  const { default: usersRoutes } = await import("./routes/usersRoutes.js");
  const { default: assetsRoutes } = await import("./routes/assetRoutes.js");
  const { default: requestsRoutes } = await import("./routes/requestRoutes.js");
  const { default: analyticsRoutes } = await import("./routes/analyticsRoutes.js");
  const { default: paymentsRoutes } = await import("./routes/stripeRoutes.js");
  const { default: assignedRoutes } = await import("./routes/assignedRoutes.js");
  const { default: publicRoutes } = await import("./routes/publicRoutes.js");
  const { default: noticeRoutes } = await import("./routes/noticeRoutes.js");

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

  // Start server after routes are set up
  app.listen(process.env.PORT, () =>
    console.log("✅ Server running on port", process.env.PORT)
  );
}).catch(err => {
  console.error("❌ Failed to connect to MongoDB:", err);
  process.exit(1);
});
