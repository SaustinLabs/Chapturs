import type { Metadata } from 'next'
import { prisma } from '@/lib/database/PrismaService'
import { resolveCoverSrc } from '@/lib/images'

const BASE_URL = process.env.NEXTAUTH_URL || 'https://chapturs.com'

interface ChapterLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string; chapterId: string }>
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string; chapterId: string }>
}): Promise<Metadata> {
  const { id, chapterId } = await params

  try {
    const [section, work] = await Promise.all([
      prisma.section.findUnique({
        where: { id: chapterId },
        select: { title: true, chapterNumber: true, workId: true }
      }),
      prisma.work.findUnique({
        where: { id },
        include: { author: { include: { user: true } } }
      })
    ])

    if (!section || !work) {
      return { title: 'Chapter Not Found | Chapturs' }
    }

    const authorUser = (work as any).author?.user
    const authorName = authorUser?.displayName || authorUser?.username || 'Unknown Author'
    const chapterLabel = section.chapterNumber ? `Chapter ${section.chapterNumber}` : section.title
    const title = `${chapterLabel} — ${work.title} by ${authorName} | Chapturs`
    const description = `Read ${chapterLabel} of "${work.title}" by ${authorName} on Chapturs.`

    const coverImage = work.coverImage ? resolveCoverSrc(id, work.coverImage) : null
    const imageUrl = coverImage?.startsWith('http') ? coverImage : coverImage ? `${BASE_URL}${coverImage}` : null

    return {
      title,
      description,
      openGraph: {
        type: 'article',
        title: `${chapterLabel} — ${work.title}`,
        description,
        url: `${BASE_URL}/story/${id}/chapter/${chapterId}`,
        siteName: 'Chapturs',
        ...(imageUrl && {
          images: [{ url: imageUrl, width: 800, height: 1200, alt: work.title }]
        })
      },
      twitter: {
        card: imageUrl ? 'summary_large_image' : 'summary',
        title: `${chapterLabel} — ${work.title}`,
        description,
        ...(imageUrl && { images: [imageUrl] })
      }
    }
  } catch {
    return { title: 'Chapturs' }
  }
}

export default function ChapterLayout({ children }: ChapterLayoutProps) {
  return <>{children}</>
}
