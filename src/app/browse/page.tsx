import type { Metadata } from 'next'
import BrowsePageClient from '@/components/BrowsePageClient'

export const metadata: Metadata = {
  title: 'Browse Stories',
  description: 'Discover webnovels by genre, status, and popularity on Chapturs — the creator-first reading platform.',
  alternates: {
    canonical: 'https://chapturs.com/browse',
  },
  openGraph: {
    title: 'Browse Stories | Chapturs',
    description: 'Discover webnovels by genre, status, and popularity.',
    url: 'https://chapturs.com/browse',
  },
}

export default function BrowsePage() {
  return <BrowsePageClient />
}
