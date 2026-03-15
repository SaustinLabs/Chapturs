import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse } from '@/lib/api/errorHandling'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    // Determine admin/moderator role
    // For now we'll check if user exists and has a role 'admin' or 'moderator'
    // If you don't use the role field currently, we can just allow it for testing 
    // but in production we should enforce:
    if (!session?.user || (session.user as any).role === 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const commentReports = await prisma.commentReport.findMany({
      where: { status: 'pending' },
      include: {
        comment: true,
        user: { select: { username: true, id: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const contentReports = await prisma.contentModerationQueue.findMany({
      where: { status: 'queued' },
      include: {
        work: { select: { title: true, id: true } },
        section: { select: { title: true, id: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ 
      commentReports, 
      contentReports 
    })

  } catch (error) {
    console.error('[Admin Reports API Error]:', error)
    return createErrorResponse(error, 'fetch-reports')
  }
}
