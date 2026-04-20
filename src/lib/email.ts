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

export async function sendWelcomeEmail({
  to,
  displayName,
}: {
  to: string
  displayName: string
}) {
  await sendEmail({
    to,
    subject: `Welcome to Chapturs, ${displayName}!`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;color:#111">
        <h2 style="margin:0 0 8px">Welcome to Chapturs 📖</h2>
        <p style="color:#555;margin:0 0 16px">
          Hey ${displayName}, you're in. Chapturs is where stories live — whether you're here to read or to write.
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr>
            <td style="padding:4px 0;color:#555">📚</td>
            <td style="padding:4px 8px;color:#555">Browse the feed and discover new works</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#555">🔖</td>
            <td style="padding:4px 8px;color:#555">Bookmark stories to follow their updates</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#555">✍️</td>
            <td style="padding:4px 8px;color:#555">Publish your own work in the Creator Hub</td>
          </tr>
        </table>
        <a href="${APP_URL}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin-right:8px">
          Start Reading
        </a>
        <a href="${APP_URL}/creator/dashboard" style="display:inline-block;padding:10px 20px;background:#f3f4f6;color:#111;text-decoration:none;border-radius:6px;font-weight:600">
          Start Writing
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">
          Have a question? Reply to this email or visit <a href="${APP_URL}/contact" style="color:#999">chapturs.com/contact</a>.
        </p>
      </div>
    `,
  })
}

export async function notifyChapterRejected({
  authorEmail,
  authorName,
  workTitle,
  sectionTitle,
  reason,
}: {
  authorEmail: string
  authorName: string
  workTitle: string
  sectionTitle: string
  reason?: string | null
}) {
  await sendEmail({
    to: authorEmail,
    subject: `Your chapter "${sectionTitle}" needs attention`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;color:#111">
        <h2 style="margin:0 0 8px">Chapter returned for revision</h2>
        <p style="color:#555;margin:0 0 4px">
          Hi ${authorName}, a chapter of <strong>${workTitle}</strong> was returned by our review team:
        </p>
        <p style="font-size:16px;font-weight:600;margin:0 0 16px">${sectionTitle}</p>
        ${reason ? `
        <div style="border-left:3px solid #f59e0b;padding:8px 12px;margin:0 0 20px;background:#fffbeb;border-radius:4px;color:#333">
          <strong>Reason:</strong> ${reason}
        </div>` : ''}
        <p style="color:#555;margin:0 0 20px">
          The chapter has been moved back to draft. You can revise it and resubmit from your dashboard.
        </p>
        <a href="${APP_URL}/creator/dashboard" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
          Go to Dashboard
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">
          Questions? Contact us at <a href="mailto:support@chapturs.com" style="color:#999">support@chapturs.com</a>.
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

export async function notifyAdminStorageAlert({
  status,
  storagePercent,
  operationsPercent
}: {
  status: string
  storagePercent: number
  operationsPercent: number
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'support@chapturs.com'
  await sendEmail({
    to: adminEmail,
    subject: `[ALERT] R2 Storage Capacity: ${status.toUpperCase()}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;color:#111">
        <h2 style="margin:0 0 8px">Action Required: R2 Limits Approach</h2>
        <p style="color:#555;margin:0 0 16px">The Cloudflare R2 storage usage requires attention.</p>
        <ul style="color:#333;margin:0 0 20px">
          <li><strong>Status:</strong> ${status}</li>
          <li><strong>Storage Used:</strong> ${storagePercent.toFixed(1)}%</li>
          <li><strong>Operations Used:</strong> ${operationsPercent.toFixed(1)}%</li>
        </ul>
        <p style="font-size:12px;color:#999">Sent from the automated usage monitor.</p>
      </div>
    `,
  })
}
