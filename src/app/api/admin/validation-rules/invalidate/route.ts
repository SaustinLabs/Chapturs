export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const svc = await import('@/lib/ContentValidationService')
      if (svc && typeof svc.ContentValidationService.invalidateSafetyRulesCache === 'function') {
        await svc.ContentValidationService.invalidateSafetyRulesCache()
      }
    } catch (e) {
      console.warn('Failed to invalidate safety rules cache', e)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Invalidate safety rules cache error:', error)
    return NextResponse.json({ error: 'Failed to invalidate cache' }, { status: 500 })
  }
}
