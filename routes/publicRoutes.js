import express from "express";

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

export default router;
