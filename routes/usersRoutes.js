import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, role, name } = req.body;
  const exists = await db.collection("users").findOne({ email });
  if (exists) return res.send({ message: "User exists" });

  const newUser = {
    ...req.body,
    createdAt: new Date(),
    profileImage: req.body.profileImage || "",
  };

  if (role === 'hr') {
    newUser.packageLimit = 5;
    newUser.currentEmployees = 0;
    newUser.subscription = "basic";
  }

  await db.collection("users").insertOne(newUser);
  res.send({ message: "User created" });
});

// Get current user profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await db.collection("users").findOne(
      { email: req.user.email },
      { projection: { password: 0 } }
    );
    res.send(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Update user profile
router.patch("/me", verifyToken, async (req, res) => {
  try {
    const { name, profileImage, dateOfBirth, companyLogo } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (profileImage) updateData.profileImage = profileImage;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (companyLogo && req.user.role === "hr") updateData.companyLogo = companyLogo;

    await db.collection("users").updateOne(
      { email: req.user.email },
      { $set: updateData }
    );

    res.send({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Get employee affiliations (which companies they work for)
router.get("/affiliations", verifyToken, async (req, res) => {
  try {
    const affiliations = await db.collection("employeeAffiliations")
      .find({ employeeEmail: req.user.email, status: "active" })
      .toArray();
    res.send(affiliations);
  } catch (err) {
    console.error("Get affiliations error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Get HR's employee list
router.get("/employees", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).send({ msg: "HR only" });
    }

    const affiliations = await db.collection("employeeAffiliations")
      .find({ hrEmail: req.user.email, status: "active" })
      .toArray();

    res.send(affiliations);
  } catch (err) {
    console.error("Get employees error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Get team members for employee (per company)
router.get("/team/:companyName", verifyToken, async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);

    // Verify employee has affiliation with this company
    const affiliation = await db.collection("employeeAffiliations").findOne({
      employeeEmail: req.user.email,
      companyName,
      status: "active"
    });

    if (!affiliation) {
      return res.status(403).send({ msg: "Not affiliated with this company" });
    }

    // Get all employees from the same company
    const teammates = await db.collection("employeeAffiliations")
      .find({ companyName, status: "active" })
      .toArray();

    res.send(teammates);
  } catch (err) {
    console.error("Get team error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

export default router;
