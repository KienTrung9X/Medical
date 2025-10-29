import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN
})

export default async function handler(req, res) {
  const { userId } = req.query
  const data = await redis.get(userId)
  res.status(200).json({ data })
}