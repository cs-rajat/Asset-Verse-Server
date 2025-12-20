import express from "express";
import { db } from "../config/db.js";
import { ObjectId } from "mongodb";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyHR } from "../middlewares/verifyHR.js";

const router = express.Router();

// Create request
router.post("/", verifyToken, async (req, res) => {
  try {
    console.log("Create Request Payload:", req.body);
    const { assetId, note } = req.body;

    const asset = await db.collection("assets").findOne({ _id: new ObjectId(assetId) });
    if (!asset) return res.status(404).send({ msg: "Asset not found" });

    await db.collection("requests").insertOne({
      assetId: asset._id,
      assetName: asset.productName,
      assetType: asset.productType,
      requesterEmail: req.user.email,
      requesterName: req.user.name,
      hrEmail: asset.hrEmail,
      companyName: asset.companyName,
      note: note || "",
      requestStatus: "pending",
      requestDate: new Date()
    });

    res.status(201).send({ message: "Asset requested successfully" });
  } catch (err) {
    console.error("Create request error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Get requests for HR
router.get("/hr", verifyToken, verifyHR, async (req, res) => {
  try {
    const requests = await db.collection("requests")
      .find({ hrEmail: req.user.email, requestStatus: "pending" })
      .sort({ requestDate: -1 })
      .toArray();
    res.send(requests);
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

router.patch("/approve/:id", verifyToken, verifyHR, async (req, res) => {
  try {
    const request = await db.collection("requests")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!request) return res.status(404).send({ msg: "Request not found" });
    if (request.requestStatus !== "pending") {
      return res.status(400).send({ msg: "Request already processed" });
    }

    // Get asset
    const asset = await db.collection("assets").findOne({ _id: new ObjectId(request.assetId) });
    if (!asset) return res.status(404).send({ msg: "Asset not found" });
    if (asset.availableQuantity < 1) {
      return res.status(400).send({ msg: "Asset out of stock" });
    }

    const hr = await db.collection("users").findOne({ email: req.user.email });
    const affiliation = await db.collection("employeeAffiliations").findOne({
      employeeEmail: request.requesterEmail,
      hrEmail: req.user.email
    });

    // Check package limit for NEW affiliations only
    if (!affiliation && hr.currentEmployees >= hr.packageLimit) {
      return res.status(403).send({ msg: "Package limit reached. Upgrade your package to approve more employees." });
    }

    // Create affiliation if first time
    if (!affiliation) {
      await db.collection("employeeAffiliations").insertOne({
        employeeEmail: request.requesterEmail,
        employeeName: request.requesterName,
        hrEmail: req.user.email,
        companyName: request.companyName,
        companyLogo: hr.companyLogo || "",
        status: "active",
        affiliationDate: new Date()
      });

      await db.collection("users").updateOne(
        { email: req.user.email },
        { $inc: { currentEmployees: 1 } }
      );
    }

    // Update request status
    await db.collection("requests").updateOne(
      { _id: request._id },
      {
        $set: {
          requestStatus: "approved",
          approvalDate: new Date(),
          processedBy: req.user.email
        }
      }
    );

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
      employeeEmail: request.requesterEmail,
      employeeName: request.requesterName,
      hrEmail: req.user.email,
      companyName: request.companyName,
      assignmentDate: new Date(),
      status: "assigned"
    });

    res.send({ message: "Request approved and asset assigned" });
  } catch (err) {
    console.error("Approve request error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Reject request
router.patch("/reject/:id", verifyToken, verifyHR, async (req, res) => {
  await db.collection("requests").updateOne(
    { _id: new ObjectId(req.params.id) },
    {
      $set: {
        requestStatus: "rejected",
        processedBy: req.user.email
      }
    }
  );
  res.send({ message: "Request rejected" });
});


export default router;
