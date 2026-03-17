import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/errorHandling'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    // Check role, allow if testing locally or explicitly an admin/moderator
    if (!session?.user || (session.user as any).role === 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { action, notes } = await req.json()

    if (!['dismiss', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const report = await prisma.commentReport.findUnique({
      where: { id }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (action === 'delete') {
      // Hide the comment
      await prisma.comment.update({
        where: { id: report.commentId },
        data: { isHidden: true }
      })
      
      // Update the report
      await prisma.commentReport.update({
        where: { id },
        data: { 
          status: 'actioned',
          details: notes ? `${report.details}\nAdmin Note: ${notes}` : report.details
        }
      })
    } else if (action === 'dismiss') {
      await prisma.commentReport.update({
        where: { id },
        data: { 
          status: 'reviewed',
          details: notes ? `${report.details}\nAdmin Note: ${notes}` : report.details
        }
      })
    }

    return createSuccessResponse(null, `Comment report ${action}ed successfully`)
  } catch (error) {
    console.error('[Admin Comment Report Action Error]:', error)
    return createErrorResponse(error, 'action-comment-report')
  }
}
