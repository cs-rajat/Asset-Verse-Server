import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyHR } from "../middlewares/verifyHR.js";

const router = express.Router();

// Pie Chart: Returnable vs Non-returnable distribution
router.get("/assets-distribution", verifyToken, verifyHR, async (req, res) => {
  try {
    const data = await db.collection("assets").aggregate([
      { $match: { hrEmail: req.user.email } },
      { 
        $group: { 
          _id: "$productType", 
          value: { $sum: "$productQuantity" } 
        } 
      },
      { 
        $project: { 
          _id: 0, 
          name: "$_id", 
          value: 1 
        } 
      }
    ]).toArray();

    res.send(data);
  } catch (err) {
    console.error("Assets distribution error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

// Bar Chart: Top 5 most requested assets
router.get("/top-requested", verifyToken, verifyHR, async (req, res) => {
  try {
    const data = await db.collection("requests").aggregate([
      { $match: { hrEmail: req.user.email } },
      { 
        $group: { 
          _id: "$assetName", 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { 
        $project: { 
          _id: 0, 
          assetName: "$_id", 
          count: 1 
        } 
      }
    ]).toArray();

    res.send(data);
  } catch (err) {
    console.error("Top requested error:", err);
    res.status(500).send({ msg: "Server error" });
  }
});

export default router;
