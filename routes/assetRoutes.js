import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyHR } from "../middlewares/verifyHR.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// Add asset (HR only)
router.post("/", verifyToken, verifyHR, async (req, res) => {
  try {
    const hr = await db.collection("users").findOne({ email: req.user.email });

    await db.collection("assets").insertOne({
      ...req.body,
      hrEmail: req.user.email,
      companyName: hr.companyName,
      availableQuantity: req.body.productQuantity,
      dateAdded: new Date()
    });

    res.status(201).send({ message: "Asset added successfully" });
  } catch (err) {
    console.error("Add asset error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Get all assets (accessible by employees and HR)
router.get("/", verifyToken, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 100);
    const skip = (page - 1) * limit;

    let query = {};

    // HR sees only their assets, Employees see all available assets
    if (req.user.role === "hr") {
      query = { hrEmail: req.user.email };
    }

    const assets = await db.collection("assets")
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection("assets").countDocuments(query);

    res.send({
      assets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Get assets error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Update asset (HR only)
router.put("/:id", verifyToken, verifyHR, async (req, res) => {
  try {
    const { id } = req.params;
    const { _id, ...updateData } = req.body;

    const asset = await db.collection("assets").findOne({ _id: new ObjectId(id) });
    if (!asset) return res.status(404).send({ msg: "Asset not found" });
    if (asset.hrEmail !== req.user.email) return res.status(403).send({ msg: "Not authorized" });

    if (updateData.productQuantity !== undefined) {
      const diff = updateData.productQuantity - asset.productQuantity;
      updateData.availableQuantity = asset.availableQuantity + diff;
    }

    await db.collection("assets").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    res.send({ message: "Asset updated" });
  } catch (err) {
    console.error("Update asset error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Delete asset (HR only)
router.delete("/:id", verifyToken, verifyHR, async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await db.collection("assets").findOne({ _id: new ObjectId(id) });
    if (!asset) return res.status(404).send({ msg: "Asset not found" });
    if (asset.hrEmail !== req.user.email) return res.status(403).send({ msg: "Not authorized" });

    await db.collection("assets").deleteOne({ _id: new ObjectId(id) });
    res.send({ message: "Asset deleted" });
  } catch (err) {
    console.error("Delete asset error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

export default router;
