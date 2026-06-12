import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectDB = async () => {
    try {
        if (!ENV.DB_URL) {
            throw new Error(
                ENV.IS_DEV
                    ? "No database URL found. Set LOCAL_DB_URL for development."
                    : "DB_URL is not defined in environment variables"
            );
        }

        const conn = await mongoose.connect(ENV.DB_URL);
        const label = ENV.IS_DEV ? "LOCAL MongoDB" : "MongoDB Atlas";
        console.log(`[${ENV.NODE_ENV}] Connected to ${label}: ${conn.connection.host}`);
    }
    catch (error) {
        console.error("Error connecting to MongoDB", error);
        process.exit(1); // 0 success, 1 failure
    }
};