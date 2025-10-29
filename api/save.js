import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN
})

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end()
    return
  }

  const { userId, data } = req.body
  await redis.set(userId, data)

  res.status(200).json({ ok: true })
}