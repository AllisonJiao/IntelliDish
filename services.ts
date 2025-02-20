import { MongoClient } from "mongodb";
// update to mongoose
import mongoose from "mongoose";

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/IntelliDish", {
            serverSelectionTimeoutMS: 5000,  // Reduce timeout to detect issues fast
        });
        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        process.exit(1); //Stop server if DB connection fails
    }
}

export default connectDB;

export const client = new MongoClient("mongodb://localhost:27017/");