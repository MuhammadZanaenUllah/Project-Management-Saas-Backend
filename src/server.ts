// src/index.ts
import app from "./app";
import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import serverless from "serverless-http";

const isVercel = !!process.env.VERCEL;

// Local development mode
if (!isVercel) {
  const PORT = config.PORT || 5000;
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await connectDatabase();
  });
} else {
  // Vercel serverless cold start
  connectDatabase().catch((err) => {
    console.error("Error connecting to Mongo database", err);
  });
}

// Vercel serverless export (default export)
export default serverless(app);
