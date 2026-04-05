export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

// ---------------------------------------------------------------------------
// In-memory rate limiter – simple, no Redis required.
// Resets on server restart (acceptable for this low-frequency endpoint).
// ---------------------------------------------------------------------------
interface AttemptRecord {
  count: number
  windowStart: number
}
const attempts = new Map<string, AttemptRecord>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1_000 // 15 minutes

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const rec = attempts.get(ip)
  if (!rec || now - rec.windowStart > WINDOW_MS) return false
  return rec.count >= MAX_ATTEMPTS
}

function recordFailure(ip: string): void {
  const now = Date.now()
  const rec = attempts.get(ip)
  if (!rec || now - rec.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now })
  } else {
    attempts.set(ip, { count: rec.count + 1, windowStart: rec.windowStart })
  }
}

function clearAttempts(ip: string): void {
  attempts.delete(ip)
}

// ---------------------------------------------------------------------------
// POST /api/admin/bootstrap
// Body: { pin: string }
// The requester must be signed in. Their session email is matched against
// ADMIN_EMAIL. The submitted PIN is compared to ADMIN_BOOTSTRAP_PIN.
// On success the user's DB role is elevated to 'admin'.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Try again in 15 minutes.' },
      { status: 429 }
    )
  }

  // Must be authenticated
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const adminPin = process.env.ADMIN_BOOTSTRAP_PIN?.trim()

  if (!adminEmail || !adminPin) {
    // Env vars not configured – silently refuse rather than leaking config state
    recordFailure(ip)
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 403 })
  }

  const { pin } = await req.json().catch(() => ({ pin: '' }))

  const emailMatches = session.user.email.toLowerCase() === adminEmail
  const pinMatches = String(pin).trim() === adminPin

  if (!emailMatches || !pinMatches) {
    recordFailure(ip)
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 403 })
  }

  // Credentials valid – elevate role
  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { role: 'admin' },
    })
  } catch (err) {
    console.error('[bootstrap] DB update failed:', err)
    return NextResponse.json({ error: 'Failed to update role. Please try again.' }, { status: 500 })
  }

  clearAttempts(ip)

  return NextResponse.json({ ok: true })
}
