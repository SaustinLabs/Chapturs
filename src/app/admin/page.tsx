'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { 
  UsersIcon, 
  BookOpenIcon, 
  EyeIcon, 
  TrophyIcon, 
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  LinkIcon
} from '@heroicons/react/24/outline'

interface Stats {
  totalUsers: number
  totalWorks: number
  totalViews: number
  activeContests: number
  pendingReports: number
  newUsersThisWeek: number
}

export default function AdminHubPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data.data.stats.overview)
        }
      } catch (e) {
        console.error('Failed to load stats')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const cards = [
    { name: 'Total Users', value: stats?.totalUsers || 0, icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Total Works', value: stats?.totalWorks || 0, icon: BookOpenIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Total Views', value: stats?.totalViews || 0, icon: EyeIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Active Contests', value: stats?.activeContests || 0, icon: TrophyIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Pending Reports', value: stats?.pendingReports || 0, icon: ExclamationTriangleIcon, color: 'text-red-600', bg: 'bg-red-50' },
    { name: 'Growth (7d)', value: `+${stats?.newUsersThisWeek || 0}`, icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  const tools = [
    { title: 'User Management', desc: 'Manage roles and permissions.', link: '/admin/users', icon: UsersIcon },
    { title: 'Moderation Queue', desc: 'Review reported content.', link: '/admin/reports', icon: ShieldCheckIcon },
    { title: 'Contest Control', desc: 'Create and end contests.', link: '/admin/contests', icon: TrophyIcon },
    { title: 'Validation Rules', desc: 'AI safety & quality rules.', link: '/admin/validation-rules', icon: Cog6ToothIcon },
    { title: 'Community Links', desc: 'Generate named invite links for Discord, Reddit & more.', link: '/admin/community-links', icon: LinkIcon },
    { title: 'Site Settings', desc: 'Feature flags, announcements, content limits.', link: '/admin/settings', icon: Cog6ToothIcon },
  ]

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">Admin Terminal</h1>

        {loading ? (
          <div className="flex justify-center h-64 items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
              {cards.map((card, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className={`${card.bg} ${card.color} w-10 h-10 rounded-2xl flex items-center justify-center mb-4`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">{card.name}</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{card.value}</p>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">System Tools</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {tools.map((tool, i) => (
                <a
                  key={i}
                  href={tool.link}
                  className="group bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 hover:border-gray-900 dark:hover:border-white transition-all duration-300 shadow-xl hover:shadow-2xl"
                >
                  <tool.icon className="w-10 h-10 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white mb-6 transition-colors" />
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{tool.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{tool.desc}</p>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
