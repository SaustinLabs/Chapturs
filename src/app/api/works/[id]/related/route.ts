import { NextRequest, NextResponse } from 'next/server'
import { getRelatedWorks, RelatedWork } from '@/lib/recommendations/similarity'
import PrismaService from '@/lib/database/PrismaService'

const REASON_LABELS: Record<RelatedWork['signalSource'], string> = {
  author: 'Author Pick',
  collaborative: 'Readers Also Enjoyed',
  reader_to_reader: 'Finished by the Same Readers',
  semantic: 'Similar Themes',
  trending: 'Trending Now',
  popular: 'Popular',
}

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

  const data = related.map((w) => ({
    ...w,
    reasonCode: w.signalSource,
    reasonLabel: REASON_LABELS[w.signalSource] ?? 'Recommended',
  }))

  return NextResponse.json({ data })
}
