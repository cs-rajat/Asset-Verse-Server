import { MongoClient } from "mongodb";

export let db;
let client;

export const connectDB = async () => {
  if (db) return; // Already connected

  try {
    if (!client) {
      client = new MongoClient(process.env.DB_URI);
      await client.connect();
    }
    db = client.db("assetverseDB");
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("DB Connection Error:", err);
    throw err;
  }
};
