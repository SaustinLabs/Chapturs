'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { TrophyIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline'

interface Contest {
  id: string
  title: string
  description: string
  status: string
  startDate: string
  endDate: string
  prizePool: number
  _count: { entries: number }
}

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPublicContests = async () => {
      try {
        const res = await fetch('/api/contests?status=active')
        if (res.ok) {
          const data = await res.json()
          setContests(data.data.contests)
        }
      } catch (e) {
        console.error('Failed to load contests')
      } finally {
        setLoading(false)
      }
    }
    fetchPublicContests()
  }, [])

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Writing Contests</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Compete with other authors, win prizes, and grow your audience.</p>
        </div>

        {loading ? (
          <div className="flex justify-center h-64 items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <TrophyIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No active contests right now</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Check back soon for upcoming competitions!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {contests.map(contest => (
              <div key={contest.id} className="relative group overflow-hidden bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{contest.title}</h3>
                    <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                      Active
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-8 line-clamp-3 leading-relaxed">
                    {contest.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <TrophyIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-tighter opacity-70">Prize Pool</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">${contest.prizePool}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-tighter opacity-70">Deadline</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(contest.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <UsersIcon className="w-4 h-4" />
                      <span className="font-bold">{contest._count.entries} Authors Entered</span>
                    </div>
                    <button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2 rounded-xl font-bold text-sm hover:scale-105 transition active:scale-95 shadow-lg">
                      Enter Contest
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
