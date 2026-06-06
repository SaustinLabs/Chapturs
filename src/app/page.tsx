import { auth } from '@/auth'
import AppLayout from '@/components/AppLayout'
import HomeHero from '@/components/HomeHero'
import HomeWelcome from '@/components/HomeWelcome'
import NewAndPromisingSection from '@/components/NewAndPromisingSection'
import InfiniteFeed from '@/components/InfiniteFeed'
import ErrorBoundary from '@/components/ErrorBoundary'

export default async function Home() {
  const session = await auth()
  const isAuthenticated = !!session?.user
  const userName =
    (session?.user as { displayName?: string; name?: string })?.displayName ||
    (session?.user as { name?: string })?.name ||
    'Reader'

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile brand header — scrolls with page content, hidden on desktop */}
        <div className="md:hidden flex items-center mb-5 pt-1">
          <a href="/">
            <img src="/TransparentChaptursPill.png" alt="Chapturs" className="h-10 w-auto" />
          </a>
        </div>

        {isAuthenticated ? (
          <HomeWelcome userName={userName} />
        ) : (
          <HomeHero />
        )}

        {/* New & Promising — horizontal scroll strip of recent works */}
        <NewAndPromisingSection />

        {/* Infinite Feed — client component, hydrates after server render */}
        <ErrorBoundary name="Feed">
          <InfiniteFeed hubMode="reader" />
        </ErrorBoundary>
      </div>
    </AppLayout>
  )
}
