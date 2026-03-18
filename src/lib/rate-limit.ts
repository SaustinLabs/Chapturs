// Simple in-memory rate limiter for ad impressions
const hits = new Map<string, { count: number; resetAt: number }>()

export async function rateLimit(
  identifier: string,
  _key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number }> {
  const key = identifier
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  const record = hits.get(key)

  if (!record || record.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: maxRequests - 1 }
  }

  record.count++

  if (record.count > maxRequests) {
    return { success: false, remaining: 0 }
  }

  return { success: true, remaining: maxRequests - record.count }
}
