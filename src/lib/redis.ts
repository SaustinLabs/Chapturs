/**
 * Shared Upstash Redis client.
 *
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in the env.
 * Returns null when those vars are absent so callers can degrade gracefully
 * instead of crashing (e.g. local dev without Redis).
 */
import { Redis } from '@upstash/redis'

let _redis: Redis | null = null

export function getRedis(): Redis | null {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _redis = new Redis({ url, token })
  return _redis
}
