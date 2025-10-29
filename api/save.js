import { Redis } from "@upstash/redis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const redis = Redis.fromEnv();
    const { userId, data } = req.body;

    if (!userId || data === undefined) {
      return res.status(400).json({ error: "userId and data are required in the request body." });
    }

    await redis.set(userId, data);

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error in /api/save:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    res.status(500).json({ error: "Failed to connect to Redis or save data.", details: errorMessage });
  }
}
