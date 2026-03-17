import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string, blockId: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const sectionId = searchParams.get('sectionId') || ''
    
    const comments = await prisma.blockComment.findMany({
      where: {
        workId: params.id,
        blockId: params.blockId,
        sectionId: sectionId
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Failed to get block comments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string, blockId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { text, sectionId, username } = body

    if (!text) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
    }

    const newComment = await prisma.blockComment.create({
      data: {
        workId: params.id,
        sectionId: sectionId || '',
        blockId: params.blockId,
        userId: session.user.id,
        username: username || session.user.name || 'Anonymous',
        text: text
      }
    })

    return NextResponse.json({ success: true, comment: newComment })
  } catch (error) {
    console.error('Failed to create block comment:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
