export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

/**
 * DEBUG ENDPOINT
 * GET /api/creator/debug
 * 
 * Diagnostic endpoint to help identify why works don't appear in creator hub.
 * This endpoint should be REMOVED or PROTECTED before going to production!
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Endpoint disabled' }, { status: 503 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sessionUserId = session.user.id
    const sessionUserEmail = session.user.email

    console.log('[DEBUG] Session userId:', sessionUserId)
    console.log('[DEBUG] Session email:', sessionUserEmail)

    // 1. Find all users with this email
    const usersWithEmail = await prisma.user.findMany({
      where: { email: sessionUserEmail || undefined },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    })

    // 2. Find all authors for this email's users
    const authorsByEmail = await prisma.author.findMany({
      where: {
        user: {
          email: sessionUserEmail || undefined,
        },
      },
      select: {
        id: true,
        userId: true,
        verified: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        _count: {
          select: {
            works: true,
          },
        },
      },
    })

    // 3. Find author for current session user ID
    const currentAuthor = await prisma.author.findUnique({
      where: { userId: sessionUserId },
      select: {
        id: true,
        userId: true,
        verified: true,
        createdAt: true,
        _count: {
          select: {
            works: true,
          },
        },
      },
    })

    // 4. Find all works for this email's users
    const allWorksForEmail = await prisma.work.findMany({
      where: {
        author: {
          user: {
            email: sessionUserEmail || undefined,
          },
        },
      },
      select: {
        id: true,
        title: true,
        authorId: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // 5. Find works for current session author
    const currentAuthorWorks = currentAuthor
      ? await prisma.work.findMany({
          where: { authorId: currentAuthor.id },
          select: {
            id: true,
            title: true,
            authorId: true,
            createdAt: true,
          },
        })
      : []

    // 6. Check for orphaned works (works with no valid author)
    const allWorks = await prisma.work.findMany({
      select: {
        id: true,
        title: true,
        authorId: true,
        author: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    })

    const orphanedWorks = allWorks.filter((work) => !work.author)

    // Build diagnostic report
    const report = {
      session: {
        userId: sessionUserId,
        email: sessionUserEmail,
      },
      usersWithThisEmail: {
        count: usersWithEmail.length,
        users: usersWithEmail,
      },
      authorsForThisEmail: {
        count: authorsByEmail.length,
        authors: authorsByEmail.map((a) => ({
          authorId: a.id,
          userId: a.userId,
          workCount: a._count.works,
          isCurrentSessionAuthor: a.userId === sessionUserId,
        })),
      },
      currentSessionAuthor: currentAuthor
        ? {
            authorId: currentAuthor.id,
            userId: currentAuthor.userId,
            workCount: currentAuthor._count.works,
            matchesSession: currentAuthor.userId === sessionUserId,
          }
        : null,
      worksForCurrentSessionAuthor: {
        count: currentAuthorWorks.length,
        works: currentAuthorWorks.map((w) => ({
          id: w.id,
          title: w.title,
          createdAt: w.createdAt,
        })),
      },
      allWorksForThisEmail: {
        count: allWorksForEmail.length,
        works: allWorksForEmail.map((w) => ({
          id: w.id,
          title: w.title,
          authorId: w.authorId,
          authorUserId: w.author.userId,
          authorEmail: w.author.user.email,
          belongsToCurrentSession: w.author.userId === sessionUserId,
        })),
      },
      orphanedWorks: {
        count: orphanedWorks.length,
        works: orphanedWorks.map((w) => ({
          id: w.id,
          title: w.title,
          authorId: w.authorId,
        })),
      },
      diagnosis: {
        hasMultipleUsers: usersWithEmail.length > 1,
        hasMultipleAuthors: authorsByEmail.length > 1,
        currentAuthorExists: !!currentAuthor,
        currentAuthorHasWorks: currentAuthorWorks.length > 0,
        otherAuthorsHaveWorks: allWorksForEmail.length > currentAuthorWorks.length,
        possibleIssue:
          !currentAuthor
            ? 'NO_AUTHOR_PROFILE'
            : currentAuthorWorks.length === 0 && allWorksForEmail.length > 0
            ? 'WORKS_UNDER_DIFFERENT_AUTHOR'
            : currentAuthorWorks.length === 0
            ? 'NO_WORKS_CREATED'
            : 'NO_ISSUE_DETECTED',
      },
    }

    return NextResponse.json({
      success: true,
      report,
      recommendation:
        report.diagnosis.possibleIssue === 'WORKS_UNDER_DIFFERENT_AUTHOR'
          ? 'Works exist but are linked to a different author/user ID. This suggests a session or authentication mismatch. Check if user ID changed between work creation and now.'
          : report.diagnosis.possibleIssue === 'NO_AUTHOR_PROFILE'
          ? 'No author profile exists for current session user ID. Create an author profile or check authentication.'
          : report.diagnosis.possibleIssue === 'NO_WORKS_CREATED'
          ? 'No works have been created yet for this user.'
          : 'No obvious issue detected. Works should be visible in creator hub.',
    })
  } catch (error: any) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        details: error?.message || 'Unknown error',
        stack: error?.stack,
      },
      { status: 500 }
    )
  }
}
