import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middlewares/verifyToken.js";
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

// Return asset (Optional feature)
router.patch("/return/:id", verifyToken, async (req, res) => {
  try {
    const assignedAsset = await db.collection("assignedAssets")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!assignedAsset) {
      return res.status(404).send({ msg: "Assigned asset not found" });
    }

    if (assignedAsset.employeeEmail !== req.user.email) {
      return res.status(403).send({ msg: "Not authorized" });
    }

    if (assignedAsset.assetType !== "Returnable") {
      return res.status(400).send({ msg: "This asset is non-returnable" });
    }

    // Update assigned asset status
    await db.collection("assignedAssets").updateOne(
      { _id: assignedAsset._id },
      { $set: { status: "returned", returnDate: new Date() } }
    );

    // Increase available quantity
    await db.collection("assets").updateOne(
      { _id: assignedAsset.assetId },
      { $inc: { availableQuantity: 1 } }
    );

    res.send({ message: "Asset returned successfully" });
  } catch (err) {
    console.error("Return asset error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

export default router;
