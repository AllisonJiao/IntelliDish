import mongoose from "mongoose";
import dotenv from "dotenv";

async function connectDB() {
    try {
        console.log("DB_URI is: ", `"${process.env.DB_URI}"`)
        await mongoose.connect(process.env.DB_URI ?? "mongodb://localhost:27017/IntelliDish");
        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        process.exit(1); // Stop server if DB connection fails
    }
}

export default connectDB;