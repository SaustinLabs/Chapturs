'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
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
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import NotificationBell from './NotificationBell'

interface SidebarProps {
  currentHub: 'reader' | 'creator'
  onHubChange: (hub: 'reader' | 'creator') => void
}

export default function Sidebar({ currentHub, onHubChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const { data: session, status } = useSession()

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
    { icon: MagnifyingGlassIcon, label: 'Browse', href: '/browse' },
    { icon: CogIcon, label: 'Settings', href: '/reader/settings' },
    { icon: UserIcon, label: 'Profile', href: '/profile' },
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

  return (
    <>
    <div className={`
      fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
      transition-all duration-300 ease-in-out z-50
      hidden md:block
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      <div className="flex flex-col h-full">
        {/* Logo and Collapse Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <a href="/" className="flex items-center gap-2 px-2 py-1 bg-indigo-600 rounded-lg">
              <img src="/logo-transparent.png" alt="Chapturs" className="w-6 h-6 rounded" />
              <h1 className="text-base font-bold text-white tracking-wide">
                Chapturs
              </h1>
            </a>
          )}
          {isCollapsed && (
            <a href="/" className="mx-auto p-1.5 bg-indigo-600 rounded-lg">
              <img src="/logo-transparent.png" alt="Chapturs" className="w-6 h-6 rounded" />
            </a>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              {isCollapsed ? '→' : '←'}
            </div>
          </button>
        </div>

        {/* Hub Toggle */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed ? (
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
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
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
              className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title={`Switch to ${currentHub === 'reader' ? 'Creator' : 'Reader'} Hub`}
              aria-label={`Switch to ${currentHub === 'reader' ? 'Creator' : 'Reader'} Hub`}
            >
              {currentHub === 'reader' ? (
                <BookOpenIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              ) : (
                <PencilIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2" role="navigation" aria-label="Main navigation">
          {currentItems.map((item) => {
            const IconComponent = item.icon
            const isCreatorItem = currentHub === 'creator'
            const requiresAuth = isCreatorItem && !session
            
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
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium
                  ${requiresAuth 
                    ? 'text-gray-400 dark:text-gray-600 cursor-pointer hover:text-gray-500 dark:hover:text-gray-500' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                  transition-colors
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed 
                  ? (requiresAuth ? `${item.label} (Sign in required)` : item.label)
                  : (requiresAuth ? 'Sign in required' : undefined)
                }
              >
                <IconComponent className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!isCollapsed && requiresAuth && (
                  <span className="text-xs">🔒</span>
                )}
              </a>
            )
          })}
        </nav>

        {/* Authentication Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
                  flex items-center w-full px-3 py-2 rounded-lg
                  hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                  ${isCollapsed ? 'justify-center' : ''}
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
                  flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium
                  text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                  transition-colors
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? 'Sign Out' : undefined}
                aria-label="Sign out of your account"
              >
                <ArrowRightOnRectangleIcon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && 'Sign Out'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className={`
                flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium
                text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
                transition-colors
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'Sign In' : undefined}
              aria-label="Sign in with Google"
            >
              <ArrowLeftOnRectangleIcon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && 'Sign In'}
            </button>
          )}
        </div>
      </div>
    </div>
    
    {/* Mobile Bottom Navigation */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 flex justify-around items-center p-2 pb-safe">
      {currentItems.slice(0, 5).map((item) => {
        const IconComponent = item.icon
        const isCreatorItem = currentHub === 'creator'
        const requiresAuth = isCreatorItem && !session
        
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
              flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium
              ${requiresAuth 
                ? 'text-gray-400 dark:text-gray-600' 
                : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }
            `}
          >
            <IconComponent className="w-6 h-6 mb-1" />
            <span className="truncate w-16 text-center">{item.label}</span>
          </a>
        )
      })}
    </div>
    </>
  )
}
