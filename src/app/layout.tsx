import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import UsernameGuard from '@/components/auth/UsernameGuard'
import { ToastProvider } from '@/components/ui/Toast'
import { validateEnvironment } from '@/lib/config'
import { auth } from '@/auth-edge'
import ChunkRecovery from '@/components/ChunkRecovery'

const inter = Inter({ subsets: ['latin'], display: 'swap' })


export const metadata: Metadata = {
  metadataBase: new URL('https://chapturs.com'),
  title: {
    template: '%s | Chapturs',
    default: 'Chapturs - Connect with creators and stories',
  },
  description: 'Read and write webnovels on Chapturs — the creator-first platform where 70% of ad revenue goes directly to authors. Discover your next favourite story today.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Chapturs',
    description: 'Read and write webnovels on Chapturs — the creator-first platform where 70% of ad revenue goes directly to authors.',
    url: 'https://chapturs.com',
    siteName: 'Chapturs',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Chapturs — Read and write webnovels',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chapturs — Read & Write Webnovels',
    description: 'Read and write webnovels on Chapturs — the creator-first platform where 70% of ad revenue goes directly to authors.',
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
    <html lang="en" className={`h-full dark ${inter.className}`}>
      <head>
      </head>
      <body className={`font-sans h-full ${inter.className}`}>
        <ChunkRecovery />
        <AuthProvider session={session}>
          <ToastProvider>
            <UsernameGuard>
              {children}
            </UsernameGuard>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
