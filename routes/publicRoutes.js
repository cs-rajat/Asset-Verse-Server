import express from "express";
import { db } from "../config/db.js";

const router = express.Router();

const PACKAGES = [
    {
        name: "Basic",
        employeeLimit: 5,
        price: 5,
        features: ["Asset Tracking", "Employee Management", "Basic Support"]
    },
    {
        name: "Standard",
        employeeLimit: 10,
        price: 8,
        features: ["All Basic features", "Advanced Analytics", "Priority Support"]
    },
    {
        name: "Premium",
        employeeLimit: 20,
        price: 15,
        features: ["All Standard features", "Custom Branding", "24/7 Support"]
    }
];

// Get public packages
router.get("/packages", (req, res) => {
    res.send(PACKAGES);
});

// Get public stats (Real-time dynamic data)
router.get("/stats", async (req, res) => {
    try {
        const totalAssets = await db.collection("assets").countDocuments({});
        const assignedAssets = await db.collection("assignedAssets").countDocuments({ status: "assigned" });
        const pendingRequests = await db.collection("requests").countDocuments({ requestStatus: "pending" });
        const totalUsers = await db.collection("users").countDocuments({});

        // Get 3 recent assignments for the Hero "Active" list
        const recentAssignments = await db.collection("assignedAssets")
            .find({ status: "assigned" })
            .sort({ assignmentDate: -1 })
            .limit(3)
            .toArray();

        // Calculate utilization %
        const utilization = totalAssets > 0 ? Math.round((assignedAssets / totalAssets) * 100) : 0;

        res.send({
            totalAssets,
            utilization,
            pendingRequests,
            totalUsers,
            recentAssignments
        });
    } catch (err) {
        console.error("Public stats error:", err);
        res.status(500).send({ msg: "Server error" });
    }
});

export default router;
