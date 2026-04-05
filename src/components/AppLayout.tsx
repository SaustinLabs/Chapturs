'use client'

import { useState, createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

interface HubContextType {
  currentHub: 'reader' | 'creator'
  setCurrentHub: (hub: 'reader' | 'creator') => void
}

const HubContext = createContext<HubContextType | undefined>(undefined)

export const useHub = () => {
  const context = useContext(HubContext)
  if (context === undefined) {
    throw new Error('useHub must be used within a HubProvider')
  }
  return context
}

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  
  // Dark mode is applied globally via className="dark" on <html> in layout.tsx
  const currentHub: 'reader' | 'creator' = pathname.startsWith('/creator') ? 'creator' : 'reader'
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Stub kept for HubContext consumers
  const setCurrentHub = (_hub: 'reader' | 'creator') => {}

  return (
    <HubContext.Provider value={{ currentHub, setCurrentHub }}>
      <div className="min-h-screen bg-gray-950">
        <Sidebar
          currentHub={currentHub}
          onHubChange={() => {}}
          isCollapsed={isCollapsed}
          onToggleCollapsed={() => setIsCollapsed(c => !c)}
        />
        
        {/* Main Content */}
        <div className="md:ml-64 min-h-screen flex flex-col">
          <main className={`flex-1 pb-20 md:pb-0 ${pathname.includes('/editor') ? '' : 'p-3 sm:p-4 md:p-6'}`}>
            {children}
          </main>
          
          {/* Footer */}
          <footer className="border-t border-gray-800/60 bg-gray-900/80 py-4 px-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-200">Chapturs</span>
                <span className="px-2 py-0.5 bg-yellow-900/30 text-yellow-200 text-xs font-semibold rounded">
                  BETA
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <a href="/about" className="hover:text-blue-400 transition-colors">About</a>
                <a href="/contests" className="hover:text-blue-400 transition-colors">Contests</a>
                <a href="/legal/privacy" className="hover:text-blue-400 transition-colors">Privacy</a>
                <a href="/legal/terms" className="hover:text-blue-400 transition-colors">Terms</a>
                <a href="/legal/creator-agreement" className="hover:text-blue-400 transition-colors">Creator Agreement</a>
                <a href="/about/roadmap" className="hover:text-blue-400 transition-colors">Roadmap</a>
                <a
                  href="https://x.com/chapturs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors flex items-center gap-1"
                  aria-label="Follow Chapturs on X"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>@chapturs</span>
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </HubContext.Provider>
  )
}
