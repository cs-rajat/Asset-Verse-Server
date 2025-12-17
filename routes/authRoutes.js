import express from "express";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Register HR
router.post("/register/hr", async (req, res) => {
  try {
    const { name, email, password, companyName, companyLogo, dateOfBirth } = req.body;

    const exists = await db.collection("users").findOne({ email });
    if (exists) return res.status(400).send({ msg: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      name,
      email,
      password: hashedPassword,
      role: "hr",
      companyName,
      companyLogo,
      dateOfBirth: new Date(dateOfBirth),
      packageLimit: 5,
      currentEmployees: 0,
      subscription: "basic",
      createdAt: new Date()
    };

    await db.collection("users").insertOne(user);

    const token = jwt.sign(
      { email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).send({ token, user: { ...user, password: undefined } });
  } catch (err) {
    console.error("Register HR error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Register Employee
router.post("/register/employee", async (req, res) => {
  try {
    const { name, email, password, dateOfBirth } = req.body;

    const exists = await db.collection("users").findOne({ email });
    if (exists) return res.status(400).send({ msg: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      name,
      email,
      password: hashedPassword,
      role: "employee",
      dateOfBirth: new Date(dateOfBirth),
      createdAt: new Date()
    };

    await db.collection("users").insertOne(user);

    const token = jwt.sign(
      { email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).send({ token, user: { ...user, password: undefined } });
  } catch (err) {
    console.error("Register Employee error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(401).send({ msg: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).send({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.send({ token, user: { ...user, password: undefined } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// JWT token generation (for compatibility)
// Google Login Check
router.post("/google-login", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db.collection("users").findOne({ email });

    if (user) {
      // User exists - Login
      const token = jwt.sign(
        { email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.send({ token, user: { ...user, password: undefined } });
    } else {
      // User does not exist - Prompt for Role
      return res.send({ isNewUser: true });
    }
  } catch (err) {
    console.error("Google Login Error:", err);
    res.status(500).send({ msg: "Server Error" });
  }
});

// JWT token generation (Secure: looks up user)
router.post("/jwt", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(404).send({ msg: "User not found" });
    }
    const token = jwt.sign(
      { email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.send({ token });
  } catch (err) {
    console.error("JWT Gen Error:", err);
    res.status(500).send({ msg: "Server Error" });
  }
});

export default router;
