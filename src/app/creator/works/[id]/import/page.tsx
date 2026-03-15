'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { CloudArrowUpIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function BulkImportPage() {
  const { id } = useParams()
  const router = useRouter()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<number | null>(null)

  const handleImport = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/works/${id}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      if (res.ok) {
        const data = await res.json()
        setSuccess(data.data.count)
      }
    } catch (e) {
      console.error('Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Bulk Chapter Import</h1>
          <p className="text-gray-500 dark:text-gray-400">Paste your entire manuscript. We'll automatically detect chapter breaks and create drafts.</p>
        </div>

        {success !== null ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-8 rounded-[2rem] text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-green-900 dark:text-green-100 mb-2">Import Successful!</h2>
            <p className="text-green-700 dark:text-green-300 mb-8">Generated {success} draft chapters from your text.</p>
            <button
              onClick={() => router.push(`/creator/works/${id}`)}
              className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-green-700 transition shadow-lg shadow-green-500/20"
            >
              Go to Workspace
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-8 shadow-xl">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Paste Manuscript Below</label>
              <textarea
                className="w-full h-96 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 transition-all text-gray-900 dark:text-white font-serif text-lg leading-relaxed shadow-inner"
                placeholder="Chapter 1: The Beginning... [rest of text] ... Chapter 2: The Journey..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <div className="mt-6 flex items-center justify-between">
                <div className="text-xs text-gray-400 font-bold">
                  Pro-tip: Start each chapter with "Chapter [Number]" or "Section [Number]" for best results.
                </div>
                <button
                  onClick={handleImport}
                  disabled={loading || !text.trim()}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-10 py-4 rounded-2xl font-black text-lg hover:scale-105 transition active:scale-95 disabled:opacity-20 flex items-center gap-3 shadow-2xl"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                  ) : (
                    <CloudArrowUpIcon className="w-6 h-6" />
                  )}
                  Process Text
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
