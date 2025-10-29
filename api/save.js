import { Redis } from "@upstash/redis"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { userId, data } = req.body;

  if (!userId || typeof data === 'undefined') {
    return res.status(400).json({ error: "Missing userId or data in request body." });
  }

  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      throw new Error("Database configuration is missing on the server. Please ensure KV_REST_API_URL and KV_REST_API_TOKEN environment variables are set.");
    }
    
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN
    });

    await redis.set(userId, data);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Failed to save data to Redis:", error);
    res.status(500).json({ 
      error: "Failed to connect to the database.",
      details: error.message 
    });
  }
}