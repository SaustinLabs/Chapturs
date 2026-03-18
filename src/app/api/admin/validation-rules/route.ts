export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

// GET -> list rules, POST -> create/update rule
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || !['admin', 'moderator'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rules = await prisma.validationRule.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ success: true, rules })
  } catch (error) {
    console.error('List validation rules error:', error)
    return NextResponse.json({ error: 'Failed to list rules' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, type, isActive = true, config = '{}', severity = 'medium' } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'name and type are required' }, { status: 400 })
    }

    let rule
    if (id) {
      rule = await prisma.validationRule.update({ where: { id }, data: { name, type, isActive, config, severity } })
    } else {
      rule = await prisma.validationRule.create({ data: { name, type, isActive, config, severity } })
    }

    // Invalidate in-memory cache so new rules take effect immediately
    try {
      // Lazy import to avoid circular deps at module load
      const svc = await import('@/lib/ContentValidationService')
      if (svc && typeof svc.ContentValidationService.invalidateSafetyRulesCache === 'function') {
        await svc.ContentValidationService.invalidateSafetyRulesCache()
      }
    } catch (e) {
      console.warn('Failed to invalidate safety rules cache after rule change', e)
    }

    return NextResponse.json({ success: true, rule })
  } catch (error) {
    console.error('Create/update validation rule error:', error)
    return NextResponse.json({ error: 'Failed to create/update rule' }, { status: 500 })
  }
}
