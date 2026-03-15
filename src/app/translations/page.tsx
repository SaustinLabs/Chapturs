'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { LanguageIcon, CheckBadgeIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

interface Translation {
  id: string
  language: string
  isReviewed: boolean
  machineGenerated: boolean
  updatedAt: string
  section: {
    title: string
    work: { title: string }
  }
}

export default function TranslationHub() {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/translations?status=${filter}`)
        if (res.ok) {
          const data = await res.json()
          setTranslations(data.data.translations)
        }
      } catch (e) {
        console.error('Failed to load translations')
      } finally {
        setLoading(false)
      }
    }
    fetchTranslations()
  }, [filter])

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Translation Hub</h1>
            <p className="text-gray-500 dark:text-gray-400">Help us make stories accessible to everyone.</p>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition ${filter === 'pending' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}
            >
              Needs Review
            </button>
            <button
              onClick={() => setFilter('reviewed')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition ${filter === 'reviewed' ? 'bg-white dark:bg-gray-700 shadow-sm text-green-600' : 'text-gray-500'}`}
            >
              Completed
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : translations.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <LanguageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">All caught up!</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">No translations waiting for review in this category.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {translations.map(t => (
              <div key={t.id} className="group bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xl uppercase">
                    {t.language}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{t.section.title}</h3>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{t.section.work.title}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        Updated {new Date(t.updatedAt).toLocaleDateString()}
                      </span>
                      {t.machineGenerated && (
                        <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">AI Generated</span>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={`/translations/review/${t.id}`}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-4 rounded-2xl hover:scale-110 transition active:scale-95 shadow-lg"
                >
                  <ArrowRightIcon className="w-6 h-6" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
