'use client'

import { resolveCoverSrc } from '@/lib/images'

import { useUser } from '@/hooks/useUser'
import { useState, useEffect } from 'react'
import { BookOpen, Search, Users, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import PretextClampText from './PretextClampText'

interface Work {
  id: string
  title: string
  coverImage?: string
  _count?: {
    chapters: number
    characters: number
  }
}

export default function CreatorCharactersPage() {
  const { isAuthenticated, isLoading } = useUser()
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorks()
    }
  }, [isAuthenticated])

  const fetchWorks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/creator/works')
      if (!res.ok) throw new Error('Failed to fetch works')
      
      const data = await res.json()
      if (data.success) {
        setWorks(data.works)
      }
    } catch (error) {
      console.error('Failed to fetch works:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredWorks = works.filter(work => 
    work.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <Users className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unauthorized</h2>
          <p className="text-gray-600 dark:text-gray-400">Please sign in to manage character profiles.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Character Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage interactive character profiles for your stories
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search your stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Works Grid */}
      {filteredWorks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          {works.length === 0 ? (
            <>
              <BookOpen className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Stories Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload your first story to start managing character profiles.
              </p>
              <Link 
                href="/creator/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={16} />
                Upload Story
              </Link>
            </>
          ) : (
            <>
              <Search className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Results Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search query.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorks.map((work) => (
            <Link
              key={work.id}
              href={`/creator/works/${work.id}/characters`}
              className="group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all">
                {/* Cover Image */}
                {work.coverImage ? (
                  <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-900 overflow-hidden">
                    <img
                      src={resolveCoverSrc(work.id, work.coverImage)}
                      alt={work.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <BookOpen className="text-white opacity-50" size={64} />
                  </div>
                )}

                {/* Info */}
                <div className="p-4">
                  <PretextClampText
                    as="h3"
                    text={work.title}
                    lineClamp={2}
                    font="600 16px Inter"
                    lineHeight={22}
                    className="font-semibold text-gray-900 dark:text-white mb-2"
                  />
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <BookOpen size={14} />
                      <span>{work._count?.chapters || 0} chapters</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{work._count?.characters || 0} characters</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
