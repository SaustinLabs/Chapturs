export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'
import { createErrorResponse } from '@/lib/api/errorHandling'

// Default settings seeded on first visit
const DEFAULT_SETTINGS = [
  // General
  { key: 'maintenance_mode',      value: 'false', type: 'boolean', label: 'Maintenance Mode',           description: 'Take the site offline and show a maintenance page to all visitors.', group: 'general' },
  { key: 'site_announcement',     value: '',       type: 'text',    label: 'Global Announcement Banner', description: 'Short message shown at the top of every page. Leave empty to hide.', group: 'general' },
  { key: 'registration_enabled',  value: 'true',   type: 'boolean', label: 'Allow New Registrations',   description: 'When off, new users cannot create accounts.', group: 'general' },
  // Content
  { key: 'max_chapter_words',     value: '50000',  type: 'number',  label: 'Max Words Per Chapter',      description: 'Hard cap on the word count of a single uploaded chapter.', group: 'content' },
  { key: 'featured_works_count',  value: '8',      type: 'number',  label: 'Featured Works on Homepage', description: 'How many works appear in the featured/highlighted section.', group: 'content' },
  { key: 'min_chapter_words',     value: '100',    type: 'number',  label: 'Min Words Per Chapter',      description: 'Chapters below this word count will be rejected at upload.', group: 'content' },
  // Features
  { key: 'ai_quality_enabled',    value: 'true',   type: 'boolean', label: 'AI Quality Assessment',      description: 'Run Groq AI checks on uploaded chapters. Disable to save API credits.', group: 'features' },
  { key: 'groq_model',            value: 'llama-3.3-70b-versatile', type: 'string', label: 'Groq AI Model', description: 'Which Groq model to use for quality assessment.', group: 'features' },
  { key: 'translation_enabled',   value: 'true',   type: 'boolean', label: 'Translation Panel',          description: 'Show the translation side panel on chapter reader pages.', group: 'features' },
  { key: 'comments_enabled',      value: 'true',   type: 'boolean', label: 'Site-wide Comments',         description: 'Allow readers to post comments. Does not delete existing comments.', group: 'features' },
  // Monetization
  { key: 'premium_enabled',       value: 'false',  type: 'boolean', label: 'Premium Subscriptions',      description: 'Enable the premium subscription tier for readers.', group: 'monetization' },
  { key: 'ads_enabled',           value: 'true',   type: 'boolean', label: 'Show Advertisements',        description: 'Display AdSense ad units across the site.', group: 'monetization' },
  { key: 'creator_payouts',       value: 'false',  type: 'boolean', label: 'Creator Payouts',            description: 'Enable the revenue payout system for creators.', group: 'monetization' },
]

function isAdmin(session: any) {
  const role = (session?.user as any)?.role
  return role === 'admin' || role === 'superadmin'
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Seed defaults for any keys that don't exist yet
    const existing = await prisma.siteSettings.findMany()
    const existingKeys = new Set(existing.map((s: any) => s.key))

    const toSeed = DEFAULT_SETTINGS.filter(d => !existingKeys.has(d.key))
    if (toSeed.length > 0) {
      await prisma.siteSettings.createMany({ data: toSeed })
    }

    const settings = await prisma.siteSettings.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }]
    })

    return NextResponse.json({ settings })
  } catch (error) {
    return createErrorResponse(error, 'admin-settings-get')
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { key, value } = await req.json()

    if (!key || value === undefined || value === null) {
      return NextResponse.json({ error: 'key and value are required' }, { status: 400 })
    }

    const updated = await prisma.siteSettings.upsert({
      where: { key },
      update: { value: String(value), updatedBy: (session.user as any).id },
      create: {
        key,
        value: String(value),
        type: 'string',
        label: key,
        updatedBy: (session.user as any).id,
        group: 'general',
      }
    })

    return NextResponse.json({ setting: updated })
  } catch (error) {
    return createErrorResponse(error, 'admin-settings-put')
  }
}
