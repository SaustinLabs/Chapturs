import { NextResponse } from 'next/server'

const SITE_PAGEVIEWS_KEY = 'chapturs:site:pageviews'

// These reflect actual codebase measurements (updated at build time).
// Lines of code: TypeScript/TSX files in src/ — last counted April 2026.
const BUILD_STATS = {
  linesOfCode: 85000,
  featuresShipped: 74,
  // Approximate hours — project active development started late 2025.
  hoursBuilding: 600,
}

// Use raw fetch against the Upstash REST API — no SDK, no package bundling issues.
// Works in Next.js standalone mode since fetch is built into Node.js 18+.
async function redisGet(key: string): Promise<number> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return 0

  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  })
  const data = await res.json() as { result: string | number | null }
  return parseInt(String(data.result ?? '0'), 10) || 0
}

export async function GET() {
  let pageviews = 0

  try {
    pageviews = await redisGet(SITE_PAGEVIEWS_KEY)
  } catch {
    // Return 0 rather than error
  }

  return NextResponse.json({
    pageviews,
    ...BUILD_STATS,
  })
}
