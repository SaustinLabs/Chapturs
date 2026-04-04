import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import UsernameGuard from '@/components/auth/UsernameGuard'
import { Footer } from '@/components/ui/Footer'
import { ToastProvider } from '@/components/ui/Toast'
import { validateEnvironment } from '@/lib/config'
import { auth } from '@/auth-edge'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from '@vercel/analytics/react'
import ChunkRecovery from '@/components/ChunkRecovery'


export const metadata: Metadata = {
  metadataBase: new URL('https://chapturs.com'),
  title: {
    template: '%s | Chapturs',
    default: 'Chapturs - Connect with creators and stories',
  },
  description: 'Discover and create amazing webnovels on the platform that combines the best of content discovery and creator monetization.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Chapturs',
    description: 'Discover and create amazing webnovels on the platform that combines the best of content discovery and creator monetization.',
    url: 'https://chapturs.com',
    siteName: 'Chapturs',
    images: [
      {
        url: '/og-image.jpg',
        width: 2048,
        height: 2048,
        alt: 'Chapturs Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans h-full" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <ChunkRecovery />
        <AuthProvider session={session}>
          <ToastProvider>
            <UsernameGuard>
              {children}
            </UsernameGuard>
            <Footer />
          </ToastProvider>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
