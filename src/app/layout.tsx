import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import UsernameGuard from '@/components/auth/UsernameGuard'
import { validateEnvironment } from '@/lib/config'
import { auth } from '@/auth'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://chapturs.com'),
  title: {
    template: '%s | Chapturs',
    default: 'Chapturs - Connect with creators and stories',
  },
  description: 'Discover and create amazing webnovels on the platform that combines the best of content discovery and creator monetization.',
  openGraph: {
    title: 'Chapturs',
    description: 'Discover and create amazing webnovels on the platform that combines the best of content discovery and creator monetization.',
    url: 'https://chapturs.com',
    siteName: 'Chapturs',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Chapturs Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chapturs',
    description: 'Discover and create amazing webnovels on the platform that combines the best of content discovery and creator monetization.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    other: {
      'google-adsense-account': 'ca-pub-5320775955237091',
    },
  },
}

// Validate environment on startup
validateEnvironment();

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AuthProvider session={session}>
          <UsernameGuard>
            {children}
          </UsernameGuard>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
