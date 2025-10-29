import { Redis } from "@upstash/redis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  
  try {
    const redis = Redis.fromEnv();
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required as a query parameter." });
    }

    const data = await redis.get(userId);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error in /api/load:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    res.status(500).json({ error: "Failed to connect to Redis or load data.", details: errorMessage });
  }
}
