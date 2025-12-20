import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyHR } from "../middlewares/verifyHR.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// Get assigned assets for employee (with pagination)
router.get("/", verifyToken, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const items = await db.collection("assignedAssets")
      .find({ employeeEmail: req.user.email })
      .sort({ assignmentDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection("assignedAssets").countDocuments({
      employeeEmail: req.user.email
    });

    res.send({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Get assigned assets error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Direct Assignment (HR only)
router.post("/", verifyToken, verifyHR, async (req, res) => {
  try {
    const { employeeEmail, assetId, notes } = req.body;
    console.log("Direct Assignment Payload:", req.body);

    if (!assetId) return res.status(400).send({ msg: "Missing Asset ID" });

    const asset = await db.collection("assets").findOne({ _id: new ObjectId(assetId) });
    if (!asset) return res.status(404).send({ msg: "Asset not found" });
    if (asset.hrEmail !== req.user.email) return res.status(403).send({ msg: "Not authorized for this asset" });

    if (asset.availableQuantity < 1) {
      return res.status(400).send({ msg: "Asset out of stock" });
    }

    // Verify employee affiliation
    const affiliation = await db.collection("employeeAffiliations").findOne({
      employeeEmail,
      hrEmail: req.user.email,
      status: "active"
    });

    if (!affiliation) return res.status(400).send({ msg: "Employee not affiliated with your company" });

    // Decrease asset availability
    await db.collection("assets").updateOne(
      { _id: asset._id },
      { $inc: { availableQuantity: -1 } }
    );

    // Create assigned asset record
    await db.collection("assignedAssets").insertOne({
      assetId: asset._id,
      assetName: asset.productName,
      assetImage: asset.productImage || "",
      assetType: asset.productType,
      employeeEmail,
      employeeName: affiliation.employeeName || "Employee",
      hrEmail: req.user.email,
      companyName: asset.companyName,
      assignmentDate: new Date(),
      status: "assigned",
      notes: notes || "Directly assigned by HR"
    });

    res.status(201).send({ message: "Asset assigned successfully" });

  } catch (err) {
    console.error("Direct assignment error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Return asset (Optional feature)
// Request Return (Employee)
router.patch("/return/:id", verifyToken, async (req, res) => {
  try {
    const { returnCondition, returnNote } = req.body;
    const assignedAsset = await db.collection("assignedAssets")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!assignedAsset) return res.status(404).send({ msg: "Assigned asset not found" });
    if (assignedAsset.employeeEmail !== req.user.email) return res.status(403).send({ msg: "Not authorized" });
    if (assignedAsset.assetType !== "Returnable") return res.status(400).send({ msg: "Non-returnable" });

    // Update status to 'return_requested'
    await db.collection("assignedAssets").updateOne(
      { _id: assignedAsset._id },
      {
        $set: {
          status: "return_requested",
          returnRequestDate: new Date(),
          returnCondition,
          returnNote
        }
      }
    );

    res.send({ message: "Return requested successfully" });
  } catch (err) {
    console.error("Return request error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Approve Return (HR Only)
router.patch("/approve-return/:id", verifyToken, verifyHR, async (req, res) => {
  try {
    const assignedAsset = await db.collection("assignedAssets")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!assignedAsset) return res.status(404).send({ msg: "Asset not found" });

    // Verify this asset belongs to HR's company assets (via hrEmail check)
    if (assignedAsset.hrEmail !== req.user.email) {
      return res.status(403).send({ msg: "Not authorized" });
    }

    if (assignedAsset.status !== 'return_requested') {
      return res.status(400).send({ msg: "Return validated or not requested" });
    }

    // Finalize Return
    await db.collection("assignedAssets").updateOne(
      { _id: assignedAsset._id },
      { $set: { status: "returned", returnDate: new Date() } }
    );

    // Increase Stock
    await db.collection("assets").updateOne(
      { _id: assignedAsset.assetId },
      { $inc: { availableQuantity: 1 } }
    );

    res.send({ message: "Return approved and stock updated" });
  } catch (err) {
    console.error("Approve return error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Get all return requests (HR only)
router.get("/return-requests", verifyToken, verifyHR, async (req, res) => {
  try {
    console.log("🔍 Fetching return requests for HR:", req.user.email);
    
    // Debug: Check all return_requested items
    const allReturns = await db.collection("assignedAssets")
      .find({ status: "return_requested" })
      .toArray();
    console.log("📊 Total return_requested items in DB:", allReturns.length);
    if (allReturns.length > 0) {
      console.log("Sample return request:", JSON.stringify(allReturns[0], null, 2));
    }
    
    const requests = await db.collection("assignedAssets")
      .find({ hrEmail: req.user.email, status: "return_requested" })
      .toArray();
    console.log("✅ Found return requests for this HR:", requests.length);
    res.send(requests);
  } catch (err) {
    console.error("❌ Return requests error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

export default router;
