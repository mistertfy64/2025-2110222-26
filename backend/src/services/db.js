// backend/src/services/db.js
import mongoose from "mongoose";
import "dotenv/config";

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  throw new Error("MONGODB_URI is not set in .env");
}

export default async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      // mongoose v7+ has sensible defaults; you can pass options if needed
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}
