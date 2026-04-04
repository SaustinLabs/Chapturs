'use client'

import { useState, useEffect, createContext, useContext } from 'react'
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
  
  // Force dark mode globally
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])
  
  // Determine current hub based on URL
  const currentHub: 'reader' | 'creator' = pathname.startsWith('/creator') ? 'creator' : 'reader'
  const [isCollapsed, setIsCollapsed] = useState(false)

  const setCurrentHub = (hub: 'reader' | 'creator') => {}

  const handleHubChange = (hub: 'reader' | 'creator') => {}

  return (
    <HubContext.Provider value={{ currentHub, setCurrentHub }}>
      <div className="min-h-screen bg-gray-900">
        <Sidebar
          currentHub={currentHub}
          onHubChange={handleHubChange}
          isCollapsed={isCollapsed}
          onToggleCollapsed={() => setIsCollapsed(c => !c)}
        />
        
        {/* Main Content */}
        <div className={`${isCollapsed ? 'md:ml-16' : 'md:ml-64'} transition-[margin] duration-300 ease-in-out min-h-screen flex flex-col`}>
          <main className={`flex-1 ${pathname.includes('/editor') ? '' : 'p-6'}`}>
            {children}
          </main>
          
          {/* Footer */}
          <footer className="border-t border-gray-700 bg-gray-800 py-4 px-6">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div>
                <span className="font-semibold">Chapturs</span>
                <span className="mx-2">·</span>
                <span className="px-2 py-0.5 bg-yellow-900/30 text-yellow-200 text-xs font-semibold rounded">
                  BETA
                </span>
              </div>
              <div className="flex items-center gap-4">
                <a 
                  href="/legal/privacy" 
                  className="hover:text-blue-400 transition-colors"
                >
                  Privacy
                </a>
                <a 
                  href="/legal/terms" 
                  className="hover:text-blue-400 transition-colors"
                >
                  Terms
                </a>
                <a 
                  href="/legal/creator-agreement" 
                  className="hover:text-blue-400 transition-colors"
                >
                  Creator Agreement
                </a>
                <a 
                  href="/about/roadmap" 
                  className="hover:text-blue-400 transition-colors"
                >
                  Roadmap
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </HubContext.Provider>
  )
}
