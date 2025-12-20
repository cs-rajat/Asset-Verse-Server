// Clear all database collections
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.DB_URI;
const client = new MongoClient(uri);

async function clearDatabase() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("assetverseDB");

    // List of all collections to clear
    const collections = [
      "users",
      "assets",
      "assignedAssets",
      "requests",
      "employeeAffiliations",
      "payments",
      "notices"
    ];

    console.log("\n🗑️  Starting database cleanup...\n");

    for (const collectionName of collections) {
      const result = await db.collection(collectionName).deleteMany({});
      console.log(`✅ Cleared ${collectionName}: ${result.deletedCount} documents deleted`);
    }

    console.log("\n✨ Database cleanup completed successfully!\n");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
  } finally {
    await client.close();
    console.log("👋 Connection closed");
    process.exit(0);
  }
}

clearDatabase();
