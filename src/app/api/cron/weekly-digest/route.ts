export const runtime = 'nodejs'

/**
 * Weekly Digest Cron Endpoint
 *
 * POST /api/cron/weekly-digest
 *
 * Designed to be triggered by a cron job on the VPS (e.g. via crontab or PM2).
 * Protected by a shared secret in the Authorization header.
 *
 * Sends personalized reading digests ONLY to users who:
 *   1. Explicitly opted in (weeklyDigestEnabled: true)
 *   2. Actually read something this week (no empty emails)
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildWeeklyDigests, renderDigestEmail } from '@/lib/digest/weeklyDigest'

const CRON_SECRET = process.env.CRON_SECRET || process.env.ADMIN_BOOTSTRAP_PIN
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'Chapturs <notifications@chapturs.com>'

export async function POST(req: NextRequest) {
  // ── Auth check ──
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!CRON_SECRET || token !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payloads = await buildWeeklyDigests()

    if (payloads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No eligible users for digest this week.',
        sent: 0,
      })
    }

    // ── Send emails ──
    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const payload of payloads) {
      try {
        const { subject, html } = renderDigestEmail(payload)

        if (RESEND_API_KEY) {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: FROM_ADDRESS,
              to: payload.email,
              subject,
              html,
            }),
          })

          if (res.ok) {
            sent++
          } else {
            const errText = await res.text()
            failed++
            errors.push(`${payload.email}: ${errText}`)
          }
        } else {
          // Dry run — log but don't send
          console.log(`[digest dry-run] Would email ${payload.email}: ${subject}`)
          sent++
        }
      } catch (emailErr: any) {
        failed++
        errors.push(`${payload.email}: ${emailErr.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      eligible: payloads.length,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Weekly digest cron error:', error)
    return NextResponse.json({ error: 'Digest failed' }, { status: 500 })
  }
}
