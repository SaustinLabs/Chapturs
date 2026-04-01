'use client'

import { useUser } from '@/hooks/useUser'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { 
  ArrowLeft, Search, Plus, Edit2, Trash2, Eye, 
  Loader2, FileText, TrendingUp, Hash, BookOpen
} from 'lucide-react'
import Link from 'next/link'
import GlossaryTermModal from './GlossaryTermModal'

interface GlossaryTerm {
  id: string
  term: string
  definition: string
  category?: string
  firstMentionedChapter?: number
  createdAt: string
  updatedAt: string
  _count?: {
    usageCount: number
  }
}

interface Work {
  id: string
  title: string
}

export default function WorkGlossaryPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, isLoading: userLoading } = useUser()
  const [work, setWork] = useState<Work | null>(null)
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null)

  const workId = params.id as string

  useEffect(() => {
    if (isAuthenticated && workId) {
      fetchWorkAndTerms()
    }
  }, [isAuthenticated, workId])

  const fetchWorkAndTerms = async () => {
    setLoading(true)
    try {
      // Fetch work details
      const workRes = await fetch(`/api/works/${workId}`)
      if (!workRes.ok) throw new Error('Work not found')
      const workData = await workRes.json()
      setWork(workData)

      // Fetch glossary terms
      const termsRes = await fetch(`/api/works/${workId}/glossary`)
      if (!termsRes.ok) throw new Error('Failed to fetch terms')
      const termsData = await termsRes.json()
      setTerms(termsData.entries || termsData.terms || [])
    } catch (error) {
      console.error('Failed to fetch:', error)
      toast.error('Failed to load glossary terms.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (termId: string) => {
    if (!confirm('Are you sure you want to delete this term?')) return

    try {
      const res = await fetch(`/api/works/${workId}/glossary/${termId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete')
      
      // Refresh list
      await fetchWorkAndTerms()
      toast.success('Glossary term deleted.')
    } catch (error) {
      console.error('Failed to delete term:', error)
      toast.error('Failed to delete term.')
    }
  }

  // Get unique categories
  const categories = ['all', ...new Set(terms.map(t => t.category).filter(Boolean) as string[])]

  // Filter terms
  const filteredTerms = terms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || term.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (userLoading || loading) {
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
          <FileText className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unauthorized</h2>
          <p className="text-gray-600 dark:text-gray-400">Please sign in to manage glossary terms.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header with Back Button */}
      <div className="mb-6">
        <Link
          href="/creator/glossary"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-4"
        >
          <ArrowLeft size={20} />
          Back to Stories
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {work?.title || 'Loading...'} - Glossary
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage chapter-aware definitions for this story
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Term
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Terms</p>
              <p className="text-2xl font-bold text-blue-600">{terms.length}</p>
            </div>
            <FileText className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
              <p className="text-2xl font-bold text-purple-600">{categories.length - 1}</p>
            </div>
            <Hash className="text-purple-500" size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg per Chapter</p>
              <p className="text-2xl font-bold text-green-600">
                {work ? Math.round(terms.length / Math.max(1, terms.length)) : 0}
              </p>
            </div>
            <TrendingUp className="text-green-500" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search terms or definitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          {categories.length > 1 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Terms List */}
      {filteredTerms.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <FileText className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {terms.length === 0 ? 'No Terms Yet' : 'No Results Found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {terms.length === 0 
              ? 'Start adding glossary terms to help readers understand your world.'
              : 'Try adjusting your search or filter.'}
          </p>
          {terms.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={16} />
              Add First Term
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTerms.map((term) => (
            <div
              key={term.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {term.term}
                    </h3>
                    {term.category && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                        {term.category}
                      </span>
                    )}
                    {term.firstMentionedChapter && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <BookOpen size={12} />
                        Chapter {term.firstMentionedChapter}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    {term.definition}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Added {new Date(term.createdAt).toLocaleDateString()}</span>
                    {term.updatedAt !== term.createdAt && (
                      <span>Updated {new Date(term.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTerm(term)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(term.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <GlossaryTermModal
          workId={workId}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchWorkAndTerms}
        />
      )}
      {editingTerm && (
        <GlossaryTermModal
          workId={workId}
          term={editingTerm}
          onClose={() => setEditingTerm(null)}
          onSuccess={fetchWorkAndTerms}
        />
      )}
    </div>
  )
}
