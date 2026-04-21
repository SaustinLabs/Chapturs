/**
 * Shared Upstash Redis client — raw fetch shim.
 *
 * Uses raw fetch() against the Upstash REST API instead of the @upstash/redis
 * SDK. The SDK is not reliably included in Next.js standalone bundles, causing
 * silent failures at runtime. fetch() is built into Node.js 18+ with no
 * package dependency and no bundling issues.
 *
 * Exposes only the operations this codebase actually uses:
 *   incr, expire, get, set
 *
 * Returns null from getRedis() when env vars are absent so callers degrade
 * gracefully (in-memory fallback or direct DB queries).
 */

interface UpstashResult<T> {
  result: T
}

type SetOptions = { ex?: number }

interface RedisShim {
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<void>
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, opts?: SetOptions): Promise<void>
}

function makeClient(url: string, token: string): RedisShim {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  async function command<T>(args: (string | number | unknown)[]): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(args),
    })
    const data = (await res.json()) as UpstashResult<T>
    return data.result
  }

  return {
    incr: (key) => command<number>(['INCR', key]),
    expire: (key, seconds) => command<void>(['EXPIRE', key, seconds]),
    get: <T>(key: string) => command<T | null>(['GET', key]),
    set: (key, value, opts?: SetOptions) => {
      const args: (string | number | unknown)[] = ['SET', key, value]
      if (opts?.ex) args.push('EX', opts.ex)
      return command<void>(args)
    },
  }
}

let _client: RedisShim | null = null

export function getRedis(): RedisShim | null {
  if (_client) return _client
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _client = makeClient(url, token)
  return _client
}
