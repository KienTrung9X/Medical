import { Redis } from "@upstash/redis"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({ error: "userId query parameter is required." });
  }

  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      throw new Error("Database configuration is missing on the server. Please ensure KV_REST_API_URL and KV_REST_API_TOKEN environment variables are set.");
    }

    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN
    });
    
    const data = await redis.get(userId);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Failed to load data from Redis:", error);
    res.status(500).json({ 
      error: "Failed to connect to the database.",
      details: error.message 
    });
  }
}