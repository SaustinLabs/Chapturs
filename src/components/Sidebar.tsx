'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  BookOpenIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PencilIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  BookmarkIcon,
  DocumentTextIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import NotificationBell from './NotificationBell'

interface SidebarProps {
  currentHub: 'reader' | 'creator'
  onHubChange: (hub: 'reader' | 'creator') => void
  isCollapsed: boolean
  onToggleCollapsed: () => void
}

export default function Sidebar({ currentHub, onHubChange, isCollapsed, onToggleCollapsed }: SidebarProps) {
  const [username, setUsername] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Fetch username when session is available
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => setUsername(data.username))
        .catch(err => console.error('Failed to fetch username:', err))
    }
  }, [session?.user?.id])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleSignIn = () => {
    signIn('google', { callbackUrl: '/' })
  }

  const readerItems = [
    { icon: HomeIcon, label: 'Home', href: '/' },
    { icon: BookmarkIcon, label: 'Library', href: '/library' },
    { icon: BookOpenIcon, label: 'Subscriptions', href: '/subscriptions' },
    { icon: MagnifyingGlassIcon, label: 'Search', href: '/search' },
    { icon: CogIcon, label: 'Settings', href: '/reader/settings' },
    { icon: SparklesIcon, label: 'Features', href: '/features' },
    { icon: UserIcon, label: 'Profile', href: username ? `/profile/${username}` : '/auth/signin' },
  ]

  const creatorItems = [
    { icon: ChartBarIcon, label: 'Dashboard', href: '/creator/dashboard' },
    { icon: PencilIcon, label: 'Upload', href: '/creator/upload' },
    { icon: DocumentTextIcon, label: 'Manage Stories', href: '/creator/works' },
    { icon: PhotoIcon, label: 'Fanart', href: '/creator/fanart' },
    { icon: ChartBarIcon, label: 'Analytics', href: '/creator/analytics' },
    { icon: CurrencyDollarIcon, label: 'Monetization', href: '/creator/monetization' },
    { icon: CogIcon, label: 'Settings', href: '/creator/settings' },
  ]

  const currentItems = currentHub === 'reader' ? readerItems : creatorItems
  const isReaderChapterRoute = /^\/story\/[^/]+\/chapter\/[^/]+/.test(pathname)
  const isCreatorEditorRoute = pathname.startsWith('/creator/editor')
  const shouldShowMobileNav = !isReaderChapterRoute && !isCreatorEditorRoute

  return (
    <>
    <div className={`
      fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800/60
      transition-transform duration-300 ease-in-out z-50 overflow-hidden
      hidden md:block
      ${isCollapsed ? '-translate-x-48' : 'translate-x-0'}
    `}>
      <div className="flex flex-col h-full">
        {/* Logo and Collapse Button */}
        {isCollapsed ? (
          <div className="flex flex-col items-center py-3 gap-1 border-b border-gray-800/60">
            <a href="/" className="p-1">
              <img src="/logo-transparent.png" alt="Chapturs" className="w-8 h-8 rounded" />
            </a>
            <button
              onClick={onToggleCollapsed}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300"
              aria-label="Expand sidebar"
            >
              <div className="w-4 h-4 flex items-center justify-center text-xs">→</div>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 border-b border-gray-800/60">
            <a href="/" className="flex items-center gap-2 px-2 py-1">
              <img src="/logo-transparent.png" alt="Chapturs" className="w-6 h-6 rounded" />
              <h1 className="text-base font-bold text-blue-400 tracking-wide">
                Chapturs
              </h1>
            </a>
            <button
              onClick={onToggleCollapsed}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300"
              aria-label="Collapse sidebar"
            >
              <div className="w-4 h-4 flex items-center justify-center">←</div>
            </button>
          </div>
        )}

        {/* Hub Toggle */}
        <div className={`${isCollapsed ? 'px-1 py-3' : 'p-4'} border-b border-gray-800/60`}>
          {!isCollapsed ? (
            <div className="flex bg-gray-800/50 rounded-lg p-1 gap-0.5">
              <button
                onClick={() => {
                  onHubChange('reader')
                  // Navigate to home page when switching to Reader Hub
                  if (window.location.pathname !== '/') {
                    window.location.href = '/'
                  }
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentHub === 'reader'
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                aria-pressed={currentHub === 'reader'}
                aria-label="Switch to Reader Hub"
              >
                Reader Hub
              </button>
              <button
                onClick={() => {
                  if (!session) {
                    handleSignIn()
                    return
                  }
                  onHubChange('creator')
                  // Navigate to creator dashboard when switching to Creator Hub
                  if (window.location.pathname !== '/creator/dashboard') {
                    window.location.href = '/creator/dashboard'
                  }
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentHub === 'creator'
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                } ${!session ? 'opacity-50' : ''}`}
                title={!session ? 'Sign in to access Creator Hub' : undefined}
                aria-pressed={currentHub === 'creator'}
                aria-label="Switch to Creator Hub"
              >
                Creator Hub
                {!session && <span className="ml-1 text-xs">🔒</span>}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (currentHub === 'creator' && !session) {
                  handleSignIn()
                  return
                }
                const newHub = currentHub === 'reader' ? 'creator' : 'reader'
                onHubChange(newHub)
                // Navigate to appropriate page
                if (newHub === 'reader') {
                  window.location.href = '/'
                } else {
                  window.location.href = '/creator/dashboard'
                }
              }}
              className="w-full p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300"
              title={`Switch to ${currentHub === 'reader' ? 'Creator' : 'Reader'} Hub`}
              aria-label={`Switch to ${currentHub === 'reader' ? 'Creator' : 'Reader'} Hub`}
            >
              {currentHub === 'reader' ? (
                <BookOpenIcon className="w-6 h-6 text-gray-500" />
              ) : (
                <PencilIcon className="w-6 h-6 text-gray-500" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className={`flex-1 ${isCollapsed ? 'px-1 py-4' : 'p-4'} space-y-2`} role="navigation" aria-label="Main navigation">
          {currentItems.map((item) => {
            const IconComponent = item.icon
            const isCreatorItem = currentHub === 'creator'
            const requiresAuth = isCreatorItem && !session
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
            
            return (
              <a
                key={item.href}
                href={requiresAuth ? '#' : item.href}
                onClick={(e) => {
                  if (requiresAuth) {
                    e.preventDefault()
                    handleSignIn()
                  }
                }}
                className={`
                  flex items-center rounded-lg text-sm font-medium
                  ${isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'}
                  ${requiresAuth 
                    ? 'text-gray-600 cursor-pointer hover:text-gray-500' 
                    : isActive
                      ? 'bg-blue-500/10 text-blue-300 border-l-2 border-blue-500'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white border-l-2 border-transparent'
                  }
                  transition-colors
                `}
                title={requiresAuth ? `${item.label} (Sign in required)` : item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <IconComponent className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                <span className={`flex-1 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                  isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[180px] opacity-100 ml-3'
                }`}>
                  {item.label}
                </span>
                {!isCollapsed && requiresAuth && (
                  <span className="text-xs">🔒</span>
                )}
              </a>
            )
          })}
        </nav>

        {/* Authentication Section */}
        <div className={`${isCollapsed ? 'px-1 py-4' : 'p-4'} border-t border-gray-800/60`}>
          {status === 'loading' ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          ) : session ? (
            <div className="space-y-3">
              {/* User Profile Link */}
              <a
                href={currentHub === 'creator' ? '/creator/profile/edit' : `/profile/${username || session.user?.id}`}
                className={`
                  flex items-center w-full rounded-lg
                  hover:bg-gray-800 transition-colors
                  ${isCollapsed ? 'justify-center p-2' : 'px-3 py-2'}
                `}
                title={isCollapsed ? 'View Profile' : undefined}
              >
                {!isCollapsed ? (
                  <>
                    <img
                      src={session.user?.image || ''}
                      alt="Profile"
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {session.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {currentHub === 'creator' ? 'Edit Profile →' : 'View Profile →'}
                      </p>
                    </div>
                  </>
                ) : (
                  <img
                    src={session.user?.image || ''}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                )}
              </a>
              
              {/* Notifications */}
              <NotificationBell isCollapsed={isCollapsed} />

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className={`
                  flex items-center w-full rounded-lg text-sm font-medium
                  text-red-400 hover:bg-red-900/20
                  transition-colors
                  ${isCollapsed ? 'justify-center p-2' : 'px-3 py-2'}
                `}
                title={isCollapsed ? 'Sign Out' : undefined}
                aria-label="Sign out of your account"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                  isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[100px] opacity-100 ml-3'
                }`}>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className={`
                flex items-center w-full rounded-lg text-sm font-medium
                text-blue-400 hover:bg-blue-900/20
                transition-colors
                ${isCollapsed ? 'justify-center p-2' : 'px-3 py-2'}
              `}
              title={isCollapsed ? 'Sign In' : undefined}
              aria-label="Sign in with Google"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
              <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[100px] opacity-100 ml-3'
              }`}>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
    
    {/* Mobile Bottom Navigation */}
    {shouldShowMobileNav && (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50 overflow-visible pb-safe">
      {currentHub === 'reader' ? (
        /* Reader hub: Library | Subscriptions | [Logo Home] | Search | Settings */
        <div className="flex items-center justify-around px-1 h-14 overflow-visible">
          <a
            href="/library"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
              pathname.startsWith('/library') ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <BookmarkIcon className="w-5 h-5" />
            <span>Library</span>
          </a>
          <a
            href="/subscriptions"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
              pathname.startsWith('/subscriptions') ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <BookOpenIcon className="w-5 h-5" />
            <span>Following</span>
          </a>

          {/* Centre — prominent logo / Home — lifted above the bar */}
          <a href="/" className="flex flex-col items-center -translate-y-4 flex-shrink-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all ${
              pathname === '/' ? 'bg-blue-900/40 ring-2 ring-blue-400/60' : 'bg-gray-800 border border-gray-700'
            }`}>
              <img src="/logo-transparent.png" alt="Home" className="w-10 h-10 rounded-xl" />
            </div>
          </a>

          <a
            href="/search"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
              pathname.startsWith('/search') ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            <span>Search</span>
          </a>
          <a
            href="/reader/settings"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
              pathname.startsWith('/reader/settings') ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <CogIcon className="w-5 h-5" />
            <span>Settings</span>
          </a>
        </div>
      ) : (
        /* Creator hub: first 5 creator items, unchanged */
        <div className="flex justify-around items-center px-2 py-2">
          {currentItems.slice(0, 5).map((item) => {
            const IconComponent = item.icon
            const requiresAuth = !session
            return (
              <a
                key={item.href}
                href={requiresAuth ? '#' : item.href}
                onClick={(e) => {
                  if (requiresAuth) {
                    e.preventDefault()
                    handleSignIn()
                  }
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  requiresAuth
                    ? 'text-gray-600'
                    : pathname.startsWith(item.href)
                    ? 'text-blue-400'
                    : 'text-gray-400'
                }`}
              >
                <IconComponent className="w-6 h-6 mb-1" />
                <span className="truncate w-14 text-center">{item.label}</span>
              </a>
            )
          })}
        </div>
      )}
    </div>
    )}
    </>
  )
}
