import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import StoryPageClient from '@/components/story/StoryPageClient'
import PrismaService from '@/lib/database/PrismaService'
import { prisma } from '@/lib/database/PrismaService'
import { resolveCoverSrc } from '@/lib/images'
import { getRelatedWorks } from '@/lib/recommendations/similarity'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const work = await PrismaService.getWork(id)
  if (!work) return { title: 'Story Not Found | Chapturs' }

  const authorName = (work as any).author?.displayName || (work as any).author?.username || 'Unknown'
  const title = `${work.title} by ${authorName}`
  const description = ((work as any).description ?? '').slice(0, 160) ||
    `Read ${work.title} on Chapturs 窶・a webnovel platform for independent creators.`
  const coverUrl = (work as any).coverImage
    ? resolveCoverSrc(id, (work as any).coverImage)
    : undefined
  const genres: string[] = (work as any).genres ?? []

  return {
    title,
    description,
    keywords: [...genres, work.title, authorName, 'webnovel', 'read online'],
    openGraph: {
      title,
      description,
      type: 'book',
      url: `https://chapturs.com/story/${id}`,
      siteName: 'Chapturs',
      ...(coverUrl && { images: [{ url: coverUrl, alt: `${work.title} cover` }] }),
    },
    twitter: {
      card: coverUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(coverUrl && { images: [coverUrl] }),
    },
    alternates: {
      canonical: `https://chapturs.com/story/${id}`,
    },
  }
}

export default async function StoryPage({ params }: Props) {
  const { id } = await params
  const work = await PrismaService.getWork(id)
  if (!work) notFound()

  const authorName = (work as any).author?.displayName || (work as any).author?.username || 'Unknown'
  const coverUrl = (work as any).coverImage
    ? resolveCoverSrc(id, (work as any).coverImage)
    : undefined
  const sections: any[] = (work as any).sections ?? []
  const genres: string[] = (work as any).genres ?? []

  // Fetch AI review text (cumulativeReview takes priority; fall back to earlyReview for new stories)
  const qa = await prisma.qualityAssessment.findFirst({
    where: { workId: id },
    orderBy: { createdAt: 'asc' },
    select: { earlyReview: true, cumulativeReview: true },
  })
  const aiReview =
    qa?.cumulativeReview ||
    (sections.length < 5 ? qa?.earlyReview : null) ||
    null

  // Fetch featured comments for the story page carousel
  const featuredComments = await prisma.comment.findMany({
    where: { workId: id, isFeatured: true, isHidden: false, parentId: null },
    orderBy: { featuredAt: 'desc' },
    take: 10,
    select: {
      id: true,
      content: true,
      featuredAt: true,
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      section: { select: { id: true, title: true, chapterNumber: true } },
    },
  })

  // Fetch "Readers Also Enjoyed" — uses cascade: author picks → collaborative → semantic → trending → popular
  const relatedWorks = await getRelatedWorks(id, genres, 4).catch(() => [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: work.title,
    description: (work as any).description ?? '',
    author: {
      '@type': 'Person',
      name: authorName,
    },
    genre: genres.join(', '),
    numberOfPages: sections.length,
    url: `https://chapturs.com/story/${id}`,
    ...(coverUrl && { image: coverUrl }),
    ...(sections.length > 0 && {
      hasPart: sections.map((s: any, i: number) => ({
        '@type': 'Chapter',
        position: i + 1,
        name: s.title,
        url: `https://chapturs.com/story/${id}/chapter/${s.id}`,
      })),
    }),
  }

  return (
    <AppLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StoryPageClient initialWork={work as any} aiReview={aiReview} featuredComments={featuredComments as any} relatedWorks={relatedWorks} />
    </AppLayout>
  )
}
