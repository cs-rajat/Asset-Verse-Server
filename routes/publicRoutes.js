import express from "express";
import { db } from "../config/db.js";

const router = express.Router();

const predefinedPackages = [
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

// Seed packages if empty
const seedPackages = async () => {
    try {
        const count = await db.collection("packages").countDocuments();
        if (count === 0) {
            await db.collection("packages").insertMany(predefinedPackages);
            console.log("✅ Packages seeded successfully");
        }
    } catch (err) {
        console.error("❌ Failed to seed packages:", err);
    }
};

// Run seed on init
seedPackages();

router.get("/packages", async (req, res) => {
    try {
        const packages = await db.collection("packages").find().toArray();
        res.send(packages);
    } catch (err) {
        console.error("Get packages error:", err);
        res.status(500).send({ msg: "Server error" });
    }
});

export default router;
