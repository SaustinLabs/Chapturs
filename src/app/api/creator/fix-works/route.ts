export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth-edge'
import { prisma } from '@/lib/database/PrismaService'

/**
 * FIX ENDPOINT
 * POST /api/creator/fix-works
 * 
 * Attempts to fix works that are linked to wrong author IDs.
 * This migrates works from old/duplicate author profiles to the current session's author.
 * 
 * WARNING: This modifies database records. Use with caution!
 * This endpoint should be REMOVED or PROTECTED before going to production!
 */
export async function POST(request: NextRequest) {
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

    console.log('[FIX] Starting work migration for userId:', sessionUserId)

    // 1. Get current author for session
    let currentAuthor = await prisma.author.findUnique({
      where: { userId: sessionUserId },
    })

    // If no author exists for current session, create one
    if (!currentAuthor) {
      console.log('[FIX] Creating author profile for userId:', sessionUserId)
      currentAuthor = await prisma.author.create({
        data: {
          userId: sessionUserId,
          verified: false,
          socialLinks: '[]',
        },
      })
      console.log('[FIX] Created author:', currentAuthor.id)
    }

    // 2. Find all authors for this email
    const allAuthorsForEmail = await prisma.author.findMany({
      where: {
        user: {
          email: sessionUserEmail || undefined,
        },
      },
      include: {
        _count: {
          select: {
            works: true,
          },
        },
      },
    })

    console.log(
      '[FIX] Found',
      allAuthorsForEmail.length,
      'author(s) for email:',
      sessionUserEmail
    )

    // 3. Find works under other authors (not current session author)
    const otherAuthorIds = allAuthorsForEmail
      .filter((a) => a.id !== currentAuthor!.id)
      .map((a) => a.id)

    if (otherAuthorIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No other authors found. Nothing to migrate.',
        migrated: 0,
      })
    }

    console.log('[FIX] Other author IDs to migrate from:', otherAuthorIds)

    // 4. Find works under other authors
    const worksToMigrate = await prisma.work.findMany({
      where: {
        authorId: {
          in: otherAuthorIds,
        },
      },
      select: {
        id: true,
        title: true,
        authorId: true,
      },
    })

    console.log('[FIX] Found', worksToMigrate.length, 'works to migrate')

    if (worksToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No works found under other authors. Nothing to migrate.',
        migrated: 0,
      })
    }

    // 5. Migrate works to current author
    const workIds = worksToMigrate.map((w) => w.id)

    const updateResult = await prisma.work.updateMany({
      where: {
        id: {
          in: workIds,
        },
      },
      data: {
        authorId: currentAuthor.id,
      },
    })

    console.log('[FIX] Migrated', updateResult.count, 'works to author:', currentAuthor.id)

    // 6. Clean up empty author profiles (optional - commented out for safety)
    // const emptyAuthors = allAuthorsForEmail.filter(
    //   (a) => a.id !== currentAuthor!.id && a._count.works === 0
    // )
    // if (emptyAuthors.length > 0) {
    //   await prisma.author.deleteMany({
    //     where: {
    //       id: {
    //         in: emptyAuthors.map((a) => a.id),
    //       },
    //     },
    //   })
    //   console.log('[FIX] Deleted', emptyAuthors.length, 'empty author profiles')
    // }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${updateResult.count} work(s) to current author profile`,
      migrated: updateResult.count,
      works: worksToMigrate.map((w) => ({
        id: w.id,
        title: w.title,
        oldAuthorId: w.authorId,
        newAuthorId: currentAuthor!.id,
      })),
      currentAuthor: {
        id: currentAuthor.id,
        userId: currentAuthor.userId,
      },
    })
  } catch (error: any) {
    console.error('[FIX] Error:', error)
    return NextResponse.json(
      {
        error: 'Fix endpoint failed',
        details: error?.message || 'Unknown error',
        stack: error?.stack,
      },
      { status: 500 }
    )
  }
}
