import { MongoClient } from "mongodb";

export let db;

export const connectDB = async () => {
  const client = new MongoClient(process.env.DB_URI);
  await client.connect();
  db = client.db("assetverseDB");
  console.log("MongoDB Connected");
};
