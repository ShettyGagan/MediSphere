import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const ENV = {
  PORT: process.env.PORT,
  DB_URL: process.env.DB_URL,
  CLIENT_URL: process.env.CLIENT_URL,
  STREAM_API_KEY: process.env.STREAM_API_KEY,
  STREAM_API_SECRET: process.env.STREAM_API_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  CASHFREE_APP_ID: process.env.CASHFREE_APP_ID,
  CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY,
  CASHFREE_ENV: process.env.CASHFREE_ENV || "sandbox", // "sandbox" or "production"
};