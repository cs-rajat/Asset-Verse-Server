import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyHR } from "../middlewares/verifyHR.js";
import { ObjectId } from "mongodb";

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
    const { name, email, profileImage, dateOfBirth, companyLogo } = req.body;
    console.log("Profile Update Request:", req.user.email, req.body); // Debug Log
    const updateData = {};

    if (name) updateData.name = name;
    if (profileImage) updateData.profileImage = profileImage;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (companyLogo && req.user.role === "hr") updateData.companyLogo = companyLogo;

    // Check if email is being changed
    if (email && email !== req.user.email) {
      // Check if new email already exists
      const existingUser = await db.collection("users").findOne({ email: email });
      if (existingUser) {
        return res.status(400).send({ msg: "Email already in use" });
      }
      updateData.email = email;

      // Update email in affiliations if user is HR
      if (req.user.role === "hr") {
        await db.collection("employeeAffiliations").updateMany(
          { hrEmail: req.user.email },
          { $set: { hrEmail: email } }
        );
      }
      // Update email in affiliations if user is employee
      if (req.user.role === "employee") {
        await db.collection("employeeAffiliations").updateMany(
          { employeeEmail: req.user.email },
          { $set: { employeeEmail: email } }
        );
      }
    }

    await db.collection("users").updateOne(
      { email: req.user.email },
      { $set: updateData }
    );

    res.send({ message: "Profile updated successfully", newEmail: updateData.email });
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

// Get HR's employee list with asset counts
router.get("/employees", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).send({ msg: "HR only" });
    }

    const affiliations = await db.collection("employeeAffiliations")
      .find({ hrEmail: req.user.email, status: "active" })
      .toArray();

    // Enrich with asset count and profile image from users collection
    const enrichedAffiliations = await Promise.all(affiliations.map(async (aff) => {
      const assignedCount = await db.collection("assignedAssets").countDocuments({
        employeeEmail: aff.employeeEmail,
        hrEmail: req.user.email,
        status: "assigned"
      });

      // Also fetch the actual user to get the latest profile image if needed
      const user = await db.collection("users").findOne({ email: aff.employeeEmail });

      return {
        ...aff,
        assetsCount: assignedCount,
        profileImage: user?.profileImage || aff.companyLogo || "", // Fallback logic
        joinDate: aff.affiliationDate
      };
    }));

    res.send(enrichedAffiliations);
  } catch (err) {
    console.error("Get employees error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Remove employee from team
router.delete("/affiliations/:id", verifyToken, verifyHR, async (req, res) => {
  try {
    console.log("🗑️ Delete Employee Request:", { id: req.params.id, hrEmail: req.user.email });
    const { id } = req.params;

    // Find affiliation
    const affiliation = await db.collection("employeeAffiliations").findOne({
      _id: new ObjectId(id),
      hrEmail: req.user.email
    });

    console.log("📋 Affiliation Found:", affiliation);

    if (!affiliation) {
      console.log("❌ Affiliation not found");
      return res.status(404).send({ msg: "Employee not found in your team" });
    }

    // Delete affiliation
    await db.collection("employeeAffiliations").deleteOne({ _id: new ObjectId(id) });

    // Decrement employee count for HR
    await db.collection("users").updateOne(
      { email: req.user.email },
      { $inc: { currentEmployees: -1 } }
    );

    // Optional: Return all assigned assets to inventory? 
    // For now, let's keep it simple: we just remove them from the team list.
    // In a real app, we might want to mark assets as 'returned' or 'lost'.
    // Let's implement auto-return logic for safety.
    const assignedAssets = await db.collection("assignedAssets").find({
      employeeEmail: affiliation.employeeEmail,
      hrEmail: req.user.email,
      status: "assigned"
    }).toArray();

    if (assignedAssets.length > 0) {
      for (const assetAssign of assignedAssets) {
        // Return to inventory
        await db.collection("assets").updateOne(
          { _id: assetAssign.assetId },
          { $inc: { availableQuantity: 1 } }
        );

        // Update assignment status
        await db.collection("assignedAssets").updateOne(
          { _id: assetAssign._id },
          { $set: { status: "returned", returnDate: new Date() } }
        );
      }
    }

    console.log("✅ Employee removed successfully");
    res.send({ message: "Employee removed and assets returned" });
  } catch (err) {
    console.error("❌ Remove employee error:", err);
    res.status(500).send({ msg: "Server error", error: err.message });
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

    // Enrich with user details (DOB, Profile Image)
    const enrichedTeammates = await Promise.all(teammates.map(async (mate) => {
      const user = await db.collection("users").findOne({ email: mate.employeeEmail });
      return {
        ...mate,
        dateOfBirth: user?.dateOfBirth || null,
        profileImage: user?.profileImage || mate.companyLogo || ""
      };
    }));

    res.send(enrichedTeammates);
  } catch (err) {
    console.error("Get team error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

export default router;
