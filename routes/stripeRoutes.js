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
            unit_amount: amount * 100,
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
    const { packageName, employeeLimit, transactionId } = req.body;

    // Record payment
    await db.collection("payments").insertOne({
      hrEmail: req.user.email,
      packageName,
      employeeLimit: Number(employeeLimit),
      amount: req.body.amount || 0,
      transactionId,
      paymentDate: new Date(),
      status: "completed"
    });

    // Update user package immediately
    await db.collection("users").updateOne(
      { email: req.user.email },
      {
        $set: {
          packageLimit: Number(employeeLimit),
          subscription: packageName
        }
      }
    );

    res.send({ message: "Package upgraded successfully" });
  } catch (err) {
    console.error("Payment success error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

export default router;
