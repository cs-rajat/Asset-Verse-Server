import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyHR } from "../middlewares/verifyHR.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// Create Notice (HR Only)
router.post("/", verifyToken, verifyHR, async (req, res) => {
    try {
        const { title, description, priority } = req.body;

        // Get HR's company details (assuming HR itself is the reference or from affiliations)
        // Actually, usually HR *is* the company admin.
        // We'll trust the HR user's affiliation or just store hrEmail.
        // Better: Store hrEmail and let employees find notices by their HR.

        const notice = {
            title,
            description,
            priority: priority || 'low',
            hrEmail: req.user.email,
            date: new Date(),
            readBy: [] // Array of employee emails who read it
        };

        const result = await db.collection("notices").insertOne(notice);
        res.send(result);
    } catch (err) {
        res.status(500).send({ msg: "Server error" });
    }
});

// Get Notices (For Employees & HR)
router.get("/", verifyToken, async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'hr') {
            // HR sees their own notices
            query.hrEmail = req.user.email;
        } else {
            // Employee sees notices from their affiliated HRs
            const affiliation = await db.collection("employeeAffiliations").findOne({
                employeeEmail: req.user.email,
                status: "active"
            });

            if (!affiliation) return res.send([]); // No notices if no company
            query.hrEmail = affiliation.hrEmail;
        }

        const notices = await db.collection("notices")
            .find(query)
            .sort({ date: -1 })
            .toArray();

        // Add 'isRead' flag for the requesting user
        const noticesWithStatus = notices.map(n => ({
            ...n,
            isRead: n.readBy.includes(req.user.email)
        }));

        res.send(noticesWithStatus);
    } catch (err) {
        res.status(500).send({ msg: "Server error" });
    }
});

// Mark as Read
router.patch("/:id/read", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection("notices").updateOne(
            { _id: new ObjectId(id) },
            { $addToSet: { readBy: req.user.email } }
        );
        res.send({ msg: "Marked as read" });
    } catch (err) {
        res.status(500).send({ msg: "Server error" });
    }
});

export default router;
