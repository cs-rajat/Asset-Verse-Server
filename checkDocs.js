import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.DB_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db("assetverseDB");

        const users = await db.collection("users").find({ role: "hr" }).toArray();
        console.log("HR Users:", users.map(u => ({ email: u.email, limit: u.packageLimit, sub: u.subscription })));

        const payments = await db.collection("payments").find().sort({ paymentDate: -1 }).limit(3).toArray();
        console.log("Recent Payments:", payments.map(p => ({ pkg: p.packageName, limit: p.employeeLimit, amount: p.amount })));

    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

run();
