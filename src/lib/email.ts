/**
 * Email notification utility (Resend)
 *
 * Uses the Resend HTTP API directly — no package needed.
 * Gracefully no-ops when RESEND_API_KEY is not set.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'Chapturs <notifications@chapturs.com>'
const APP_URL = process.env.NEXTAUTH_URL ?? 'https://chapturs.com'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  if (!RESEND_API_KEY) return // email not configured — silent no-op

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('[email] Resend error', res.status, body)
    }
  } catch (err) {
    console.error('[email] Failed to send email:', err)
  }
}

// ─── Templates ──────────────────────────────────────────────────────────────

export async function notifyNewComment({
  authorEmail,
  authorName,
  commenterName,
  workTitle,
  workId,
  commentPreview,
}: {
  authorEmail: string
  authorName: string
  commenterName: string
  workTitle: string
  workId: string
  commentPreview: string
}) {
  const workUrl = `${APP_URL}/story/${workId}`
  await sendEmail({
    to: authorEmail,
    subject: `${commenterName} commented on "${workTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;color:#111">
        <h2 style="margin:0 0 8px">New comment on <em>${workTitle}</em></h2>
        <p style="color:#555;margin:0 0 16px"><strong>${commenterName}</strong> wrote:</p>
        <blockquote style="border-left:3px solid #3b82f6;padding:8px 12px;margin:0 0 20px;background:#f0f7ff;border-radius:4px;color:#333">
          ${commentPreview.slice(0, 300)}${commentPreview.length > 300 ? '…' : ''}
        </blockquote>
        <a href="${workUrl}#comments" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
          View Comment
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">
          You're receiving this because readers commented on your work.<br>
          <a href="${APP_URL}/reader/settings" style="color:#999">Manage notifications</a>
        </p>
      </div>
    `,
  })
}

export async function notifyNewSubscriber({
  authorEmail,
  authorName,
  subscriberName,
}: {
  authorEmail: string
  authorName: string
  subscriberName: string
}) {
  await sendEmail({
    to: authorEmail,
    subject: `${subscriberName} subscribed to your works`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;color:#111">
        <h2 style="margin:0 0 8px">New subscriber! 🎉</h2>
        <p style="color:#555;margin:0 0 20px">
          <strong>${subscriberName}</strong> is now subscribed to your works and will be notified when you publish new chapters.
        </p>
        <a href="${APP_URL}/creator/dashboard" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
          View Dashboard
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">
          <a href="${APP_URL}/creator/settings" style="color:#999">Manage notifications</a>
        </p>
      </div>
    `,
  })
}

export async function notifyNewChapter({
  subscriberEmail,
  subscriberName,
  authorDisplayName,
  workTitle,
  workId,
  chapterTitle,
  chapterId,
}: {
  subscriberEmail: string
  subscriberName: string
  authorDisplayName: string
  workTitle: string
  workId: string
  chapterTitle: string
  chapterId: string
}) {
  const chapterUrl = `${APP_URL}/story/${workId}/chapter/${chapterId}`
  await sendEmail({
    to: subscriberEmail,
    subject: `New chapter: "${chapterTitle}" — ${workTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;color:#111">
        <h2 style="margin:0 0 8px">New chapter available</h2>
        <p style="color:#555;margin:0 0 8px"><strong>${authorDisplayName}</strong> published a new chapter of <em>${workTitle}</em>:</p>
        <p style="font-size:18px;font-weight:600;margin:0 0 20px">${chapterTitle}</p>
        <a href="${chapterUrl}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
          Read Now
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">
          You're subscribed to updates from ${authorDisplayName}.<br>
          <a href="${APP_URL}/reader/settings" style="color:#999">Manage notifications</a>
        </p>
      </div>
    `,
  })
}
