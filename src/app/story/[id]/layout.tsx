import type { Metadata } from 'next'
import { prisma } from '@/lib/database/PrismaService'
import { resolveCoverSrc } from '@/lib/images'

const BASE_URL = process.env.NEXTAUTH_URL || 'https://chapturs.com'

interface StoryLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params

  try {
    const work = await prisma.work.findUnique({
      where: { id },
      include: {
        author: { include: { user: true } }
      }
    })

    if (!work) {
      return { title: 'Story Not Found | Chapturs' }
    }

    const authorUser = (work as any).author?.user
    const authorName = authorUser?.displayName || authorUser?.username || 'Unknown Author'
    const title = `${work.title} by ${authorName} | Chapturs`
    const description = work.description
      ? work.description.length > 200
        ? work.description.slice(0, 197) + '...'
        : work.description
      : `Read ${work.title} on Chapturs — a modern webnovel platform.`

    const coverImage = work.coverImage ? resolveCoverSrc(id, work.coverImage) : null
    const imageUrl = coverImage?.startsWith('http') ? coverImage : coverImage ? `${BASE_URL}${coverImage}` : null

    return {
      title,
      description,
      openGraph: {
        type: 'book',
        title: work.title,
        description,
        url: `${BASE_URL}/story/${id}`,
        siteName: 'Chapturs',
        ...(imageUrl && {
          images: [{ url: imageUrl, width: 800, height: 1200, alt: work.title }]
        })
      },
      twitter: {
        card: imageUrl ? 'summary_large_image' : 'summary',
        title: work.title,
        description,
        ...(imageUrl && { images: [imageUrl] })
      }
    }
  } catch {
    return { title: 'Chapturs' }
  }
}

export default function StoryLayout({ children }: StoryLayoutProps) {
  return <>{children}</>
}
