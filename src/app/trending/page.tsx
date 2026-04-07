import type { Metadata } from 'next'
import TrendingPageClient from '@/components/TrendingPageClient'

export const metadata: Metadata = {
  title: 'Trending Stories',
  description: 'The most-read webnovels right now on Chapturs. Filter by this week, this month, or all time.',
  alternates: {
    canonical: 'https://chapturs.com/trending',
  },
  openGraph: {
    title: 'Trending Stories | Chapturs',
    description: 'The most-read webnovels right now.',
    url: 'https://chapturs.com/trending',
  },
}

export default function TrendingPage() {
  return <TrendingPageClient />
}
