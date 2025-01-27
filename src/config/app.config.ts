import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const appConfig = () => ({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "8000",
  BASE_PATH: process.env.BASE_PATH || "/api",
  MONGO_URI: process.env.MONGO_URI || "",

  SESSION_SECRET: process.env.SESSION_SECRET || "",
  SESSION_EXPIRES_IN: process.env.SESSION_EXPIRES_IN || "1d",

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || "",

  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  FRONTEND_GOOGLE_CALLBACK_URL: process.env.FRONTEND_GOOGLE_CALLBACK_URL || "",
});

export const config = appConfig();
