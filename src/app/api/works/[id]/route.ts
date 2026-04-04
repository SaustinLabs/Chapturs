export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import DatabaseService, { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'
import { persistDescriptionTranslations } from '@/lib/translation'

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params

    console.log(`Works API: Fetching work with ID: ${id}`)

    const work = await DatabaseService.getWork(id)

    if (!work) {
      console.log(`Works API: Work not found with ID: ${id}`)
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      )
    }

    console.log(`Works API: Successfully fetched work: ${work.title}`)
    return NextResponse.json(work)

  } catch (error) {
    console.error('Works API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params

    // Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`Works API: Updating work ${id} for user ${session.user.id}`)

    // Verify ownership
    const existingWork = await DatabaseService.getWork(id)
    if (!existingWork) {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      )
    }

    console.log(`Works API: Ownership check - Work authorId: ${existingWork.authorId}, Session userId: ${session.user.id}`)
    
    // Get the author ID associated with this user
    const author = await prisma.author.findUnique({
      where: { userId: session.user.id }
    })

    if (!author) {
      console.error(`Works API: No author profile found for user ${session.user.id}`)
      return NextResponse.json(
        { error: 'Author profile not found. Please create an author profile first.' },
        { status: 403 }
      )
    }

    console.log(`Works API: Found author ${author.id} for user ${session.user.id}`)

    if (existingWork.authorId !== author.id) {
      console.error(`Works API: Ownership mismatch - Work authorId: ${existingWork.authorId}, User authorId: ${author.id}`)
      return NextResponse.json(
        { error: 'Forbidden: You do not own this work' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      title,
      description,
      genres,
      tags,
      maturityRating,
      status,
      coverImage
    } = body

    console.log(`Works API: Updating work with data:`, { title, description, status, genres, tags, maturityRating, coverImage })

    // Prepare update data
    const VALID_STATUSES = ['draft', 'ongoing', 'completed', 'hiatus', 'unpublished', 'published']
    const VALID_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17']

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }
    if (maturityRating && !VALID_RATINGS.includes(maturityRating)) {
      return NextResponse.json({ error: 'Invalid maturity rating' }, { status: 400 })
    }

    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (genres) updateData.genres = JSON.stringify(genres)
    if (tags) updateData.tags = JSON.stringify(tags)
    if (maturityRating) updateData.maturityRating = maturityRating
    if (status) updateData.status = status
    if (coverImage !== undefined) updateData.coverImage = coverImage

    console.log(`Works API: Prepared update data:`, JSON.stringify(updateData, null, 2))

    // Update work - keep it simple, just update the fields
    const updatedWork = await prisma.work.update({
      where: { id },
      data: updateData
    })
    
    // If description was updated, regenerate AI translations for the description field
    if (description !== undefined) {
      await persistDescriptionTranslations(id, description)
    }

    console.log(`Works API: Successfully updated work: ${updatedWork.title}`)
    return NextResponse.json({
      success: true,
      work: {
        id: updatedWork.id,
        title: updatedWork.title,
        status: updatedWork.status,
        coverImage: updatedWork.coverImage
      },
      message: 'Work updated successfully'
    })

  } catch (error) {
    console.error('Works API PUT Error:', error)
    console.error('Works API PUT Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Works API PUT Error message:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Failed to update work' },
      { status: 500 }
    )
  }
}
