import serverless from "serverless-http";
import app from "./app";
import connectDatabase from "../src/config/database.config";

// Connect to DB on cold start
connectDatabase();

export const handler = serverless( app );