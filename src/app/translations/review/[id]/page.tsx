'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { CheckBadgeIcon, ChevronLeftIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'

export default function TranslationReviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const [translation, setTranslation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/translations/${id}`)
        if (res.ok) {
          const data = await res.json()
          setTranslation(data.data.translation)
        }
      } catch (e) {
        console.error('Load failed')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  const handleSave = async (isReviewed = false) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/translations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: translation.content,
          isReviewed
        })
      })
      if (res.ok) {
        if (isReviewed) router.push('/translations')
      }
    } catch (e) {
      console.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  )

  const sourceBlocks = translation.section.content || []
  const translatedBlocks = translation.content || []

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 dark:bg-gray-950">
        {/* Header toolbar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
              <ChevronLeftIcon className="w-5 h-5 dark:text-white" />
            </button>
            <div>
              <h1 className="text-xl font-black dark:text-white">{translation.section.title}</h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Reviewing {translation.language.toUpperCase()} Translation</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition"
            >
              <CheckBadgeIcon className="w-5 h-5" />
              Approve Translation
            </button>
          </div>
        </div>

        {/* Side-by-side Editor */}
        <div className="flex-1 overflow-hidden flex">
          {/* Source Panel */}
          <div className="flex-1 overflow-y-auto p-12 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
            <div className="max-w-2xl mx-auto space-y-8">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Original source (EN)</label>
              {sourceBlocks.map((block: any, i: number) => (
                <div key={i} className="prose dark:prose-invert max-w-none opacity-50 select-none">
                  {block.type === 'prose' && <p>{block.data.text}</p>}
                  {block.type === 'dialogue' && (
                    <div className="pl-4 border-l-2 border-gray-300 italic">
                      {block.data.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Translation Panel */}
          <div className="flex-1 overflow-y-auto p-12 bg-white dark:bg-gray-900">
            <div className="max-w-2xl mx-auto space-y-8">
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Translated content ({translation.language.toUpperCase()})</label>
              {translatedBlocks.map((block: any, i: number) => (
                <div key={i}>
                  {block.type === 'prose' && (
                    <textarea
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-lg leading-relaxed text-gray-900 dark:text-gray-100 resize-none"
                      rows={Math.ceil((block.data.text?.length || 10) / 40)}
                      value={block.data.text}
                      onChange={e => {
                        const newBlocks = [...translatedBlocks]
                        newBlocks[i].data.text = e.target.value
                        setTranslation({ ...translation, content: newBlocks })
                      }}
                    />
                  )}
                  {block.type === 'dialogue' && (
                    <div className="flex items-start space-x-4 pl-4 border-l-2 border-blue-200 dark:border-blue-900">
                      <textarea
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-lg italic text-gray-700 dark:text-gray-300 resize-none"
                        rows={2}
                        value={block.data.text}
                        onChange={e => {
                          const newBlocks = [...translatedBlocks]
                          newBlocks[i].data.text = e.target.value
                          setTranslation({ ...translation, content: newBlocks })
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
