import express from "express";
import Stripe from "stripe";
import { db } from "../config/db.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Create Checkout Session
router.post("/create-session", verifyToken, async (req, res) => {
  try {
    const { packageName, employeeLimit, amount, hrEmail } = req.body;
    console.log(`Creating Stripe Session: ${packageName} ($${amount})`); // Debug Log
    const finalAmount = parseInt(amount);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${packageName} Package`,
              description: `Up to ${employeeLimit} employees`,
            },
            unit_amount: finalAmount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&package=${packageName}&limit=${employeeLimit}`,
      cancel_url: `${process.env.CLIENT_URL}/upgrade`,
      metadata: {
        hrEmail: hrEmail || req.user.email,
        packageName,
        employeeLimit: employeeLimit.toString(),
      },
    });

    res.send({ url: session.url });
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).send({ msg: err.message || "Payment session creation failed" });
  }
});

// Payment success callback
router.post("/payment-success", verifyToken, async (req, res) => {
  try {
    console.log("✅ Payment Success Route Called by:", req.user.email);
    const { packageName, employeeLimit, transactionId } = req.body;
    console.log("Request Body:", { packageName, employeeLimit, transactionId });

    // Verify session and get amount
    const session = await stripe.checkout.sessions.retrieve(transactionId);
    if (!session) {
      console.error("❌ Session not found:", transactionId);
      return res.status(404).send({ msg: "Transaction not found" });
    }

    const paidAmount = session.amount_total / 100; // Convert cents to dollars
    const newLimit = parseInt(session.metadata.employeeLimit); // Source of truth
    const newPackage = session.metadata.packageName;

    console.log("💳 Processing Payment from Metadata:", { newLimit, newPackage, paidAmount });

    // Record payment
    await db.collection("payments").insertOne({
      hrEmail: req.user.email,
      packageName: newPackage,
      employeeLimit: newLimit,
      amount: paidAmount,
      transactionId,
      paymentDate: new Date(),
      status: "completed"
    });

    // Get current user data
    const currentUser = await db.collection("users").findOne({ email: req.user.email });
    console.log("👤 Current User:", { email: currentUser?.email, currentLimit: currentUser?.packageLimit });

    // Update user package - ADDITIVE (Buy Seats model)
    const updateResult = await db.collection("users").updateOne(
      { email: req.user.email },
      {
        $inc: { packageLimit: newLimit }, // Add to existing limit
        $set: { subscription: newPackage } // Update package name to latest bought
      }
    );
    
    // Get updated user data
    const updatedUser = await db.collection("users").findOne({ email: req.user.email });
    console.log("✅ Database Updated:", {
      email: req.user.email,
      oldLimit: currentUser?.packageLimit,
      addedLimit: newLimit,
      newLimit: updatedUser?.packageLimit,
      modifiedCount: updateResult.modifiedCount
    });

    res.send({ 
      message: "Package upgraded successfully",
      oldLimit: currentUser?.packageLimit,
      newLimit: updatedUser?.packageLimit
    });
  } catch (err) {
    console.error("Payment success error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Get Payment History
router.get("/history", verifyToken, async (req, res) => {
  try {
    const history = await db.collection("payments")
      .find({ hrEmail: req.user.email })
      .sort({ paymentDate: -1 })
      .toArray();
    res.send(history);
  } catch (err) {
    console.error("Get payment history error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

export default router;
