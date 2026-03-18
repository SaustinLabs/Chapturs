export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/errorHandling'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user as any).role === 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { action, notes } = await req.json()

    if (!['approve', 'reject'].includes(action)) {
      // approve = content is good, report is rejected
      // reject = content is bad, report is approved
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const report = await prisma.contentModerationQueue.findUnique({
      where: { id }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // "approve" the content (meaning dismiss the report)
    // "reject" the content (meaning accept the report, content needs removal/flagging)
    const newStatus = action === 'approve' ? 'rejected' : 'approved'

    // If 'reject', we could unpublish the section or set the work to hidden.
    // For MVP, we will conditionally unpublish the Section if it's a section report.
    if (action === 'reject' && report.sectionId) {
      await prisma.section.update({
        where: { id: report.sectionId },
        data: { status: 'draft' } // unpublish
      })
    } else if (action === 'reject' && report.workId) {
      await prisma.work.update({
        where: { id: report.workId },
        data: { status: 'draft' } // unpublish
      })
    }

    await prisma.contentModerationQueue.update({
      where: { id },
      data: { 
        status: newStatus,
        completedAt: new Date(),
        assignedTo: session.user.id,
        notes: notes ? `${report.notes}\nAdmin Note: ${notes}` : report.notes
      }
    })

    return createSuccessResponse(null, `Content report processed as ${newStatus}`)
  } catch (error) {
    console.error('[Admin Content Report Action Error]:', error)
    return createErrorResponse(error, 'action-content-report')
  }
}
