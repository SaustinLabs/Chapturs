import { NextRequest, NextResponse } from 'next/server'
import { getRelatedWorks } from '@/lib/recommendations/similarity'
import PrismaService from '@/lib/database/PrismaService'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Resolve genres for the genre-based fallbacks
  const work = await PrismaService.getWork(id)
  if (!work) {
    return NextResponse.json({ error: 'Work not found' }, { status: 404 })
  }

  const genres: string[] = (() => {
    try {
      return JSON.parse((work as any).genres ?? '[]') as string[]
    } catch {
      return []
    }
  })()

  const related = await getRelatedWorks(id, genres, 4)

  return NextResponse.json({ data: related })
}
