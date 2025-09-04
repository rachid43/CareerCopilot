// Import the Vercel-compatible Express app
import { getApp } from "../dist/vercel.js";

// Export the serverless function handler
export default async function handler(req, res) {
  try {
    const app = await getApp();
    
    // Handle the request with the Express app
    return app(req, res);
  } catch (error) {
    console.error("Vercel handler error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}