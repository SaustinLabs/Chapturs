'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { useUser } from '@/hooks/useUser'
import ImageUpload from '@/components/upload/ImageUpload'
import { useToast } from '@/components/ui/Toast'
import { Edit3, Search, X, BookOpen, Sparkles } from 'lucide-react'
import { resolveCoverSrc } from '@/lib/images'

interface RecommendedWork {
  id: string
  title: string
  coverImage?: string
  genres?: string[]
  author?: { user?: { username?: string; displayName?: string } }
}

export default function EditWorkPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const workId = params?.id as string
  const { userId, isAuthenticated, isLoading: userLoading } = useUser()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [work, setWork] = useState<any>(null)
  const [pendingSuggestions, setPendingSuggestions] = useState(0)

  // Author-curated recommendations
  const [picks, setPicks] = useState<RecommendedWork[]>([])
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<RecommendedWork[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genres: [] as string[],
    tags: [] as string[],
    maturityRating: 'PG',
    aiUseDisclosure: 'none',
    status: 'draft',
    coverImage: ''
  })

  useEffect(() => {
    if (!isAuthenticated || !userId) return
    
    const fetchWork = async () => {
      try {
        const response = await fetch(`/api/works/${workId}`)
        if (response.ok) {
          const data = await response.json()
          setWork(data)
          setFormData({
            title: data.title || '',
            description: data.description || '',
            genres: data.genres || [],
            tags: data.tags || [],
            maturityRating: data.maturityRating || 'PG',
            aiUseDisclosure: data.aiUseDisclosure || 'none',
            status: data.status || 'draft',
            coverImage: data.coverImage || ''
          })
        }
      } catch (error) {
        console.error('Failed to fetch work:', error)
        toast.error('Failed to load work details.')
      } finally {
        setLoading(false)
      }
    }

    const fetchPendingSuggestions = async () => {
      try {
        const res = await fetch(`/api/edit-suggestions?workId=${workId}&status=pending`)
        if (res.ok) {
          const data = await res.json()
          setPendingSuggestions((data.suggestions || []).length)
        }
      } catch {
        // non-critical — ignore
      }
    }

    fetchWork()
    fetchPendingSuggestions()
  }, [workId, isAuthenticated, userId])

  // Load existing picks
  useEffect(() => {
    if (!workId) return
    fetch(`/api/works/${workId}/author-recommendations`)
      .then(r => r.json())
      .then(d => setPicks(d.data ?? []))
      .catch(() => {})
  }, [workId])

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      console.log('Saving work with formData:', formData)
      const response = await fetch(`/api/works/${workId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Save successful:', result)
        toast.success('Work updated successfully.')
        router.push('/creator/works')
      } else {
        const error = await response.json()
        console.error('Save failed:', error)
        toast.error(`Failed to update work: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving work:', error)
      toast.error('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  async function savePicks(newPicks: RecommendedWork[]) {
    try {
      await fetch(`/api/works/${workId}/author-recommendations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendedWorkIds: newPicks.map(p => p.id) }),
      })
    } catch {
      toast.error('Failed to save recommendations.')
    }
  }

  function addPick(w: RecommendedWork) {
    if (picks.length >= 4 || picks.some(p => p.id === w.id)) return
    const newPicks = [...picks, w]
    setPicks(newPicks)
    savePicks(newPicks)
    setSearchQ('')
    setSearchResults([])
    setShowDropdown(false)
  }

  function removePick(id: string) {
    const newPicks = picks.filter(p => p.id !== id)
    setPicks(newPicks)
    savePicks(newPicks)
  }

  function handleSearchChange(q: string) {
    setSearchQ(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!q.trim()) { setSearchResults([]); setShowDropdown(false); return }
    setSearchLoading(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/works?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        const results = (data.works ?? []).filter(
          (w: RecommendedWork) => w.id !== workId && !picks.some(p => p.id === w.id)
        )
        setSearchResults(results.slice(0, 8))
        setShowDropdown(true)
      } catch {}
      finally { setSearchLoading(false) }
    }, 300)
  }

  if (userLoading || loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!work) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Work Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The work you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/creator/works')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Manage Stories
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Edit Work
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your work's metadata and settings
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cover Image
            </label>
            <ImageUpload
              entityType="cover"
              entityId={workId}
              currentImage={formData.coverImage}
              onUploadComplete={(image) => {
                 console.log('[Edit Page] Image upload complete:', image)
                 console.log('[Edit Page] Setting coverImage to:', image.urls.optimized)
                 setFormData((prev) => {
                   const updated = { ...prev, coverImage: image.urls.optimized }
                   console.log('[Edit Page] Updated formData:', updated)
                   return updated
                 })
              }}
              onUploadError={(error) => {
                console.error('Cover upload error:', error)
                toast.error(`Failed to upload cover: ${error}`)
              }}
              label="Book Cover"
              hint="Recommended: 640×1024px (portrait) or similar book cover ratio"
            />
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Genres
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Current: {formData.genres.join(', ') || 'None'}
            </p>
            <input
              type="text"
              placeholder="Enter genres separated by commas"
              onBlur={(e) => {
                const value = e.target.value
                if (value) {
                  setFormData({ ...formData, genres: value.split(',').map(g => g.trim()) })
                  e.target.value = ''
                }
              }}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Current: {formData.tags.join(', ') || 'None'}
            </p>
            <input
              type="text"
              placeholder="Enter tags separated by commas"
              onBlur={(e) => {
                const value = e.target.value
                if (value) {
                  setFormData({ ...formData, tags: value.split(',').map(t => t.trim()) })
                  e.target.value = ''
                }
              }}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Maturity Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maturity Rating
            </label>
            <select
              value={formData.maturityRating}
              onChange={(e) => setFormData({ ...formData, maturityRating: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="G">G - General Audiences</option>
              <option value="PG">PG - Parental Guidance</option>
              <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
              <option value="R">R - Restricted</option>
              <option value="NC-17">NC-17 - Adults Only</option>
            </select>
          </div>

          {/* AI Use Disclosure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              AI Use Disclosure
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Help readers make informed choices by disclosing how AI tools were used in creating this work.
            </p>
            <div className="space-y-2">
              {([
                { value: 'none', label: 'No AI use', desc: 'Entirely human-written — no AI tools used' },
                { value: 'assisted', label: 'AI-Assisted', desc: 'Human-written with AI tools for editing, grammar, or suggestions' },
                { value: 'generated', label: 'AI-Generated', desc: 'Substantially or fully produced by AI' },
              ] as const).map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.aiUseDisclosure === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="aiUseDisclosure"
                    value={value}
                    checked={formData.aiUseDisclosure === value}
                    onChange={() => setFormData({ ...formData, aiUseDisclosure: value })}
                    className="mt-0.5 accent-blue-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">Hiatus</option>
            </select>
          </div>

          {/* Readers Also Enjoyed */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Readers Also Enjoyed
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Curate up to 4 works to recommend to readers who finish this story. Your picks appear first in the "Readers Also Enjoyed" block.
            </p>

            {/* Current picks */}
            {picks.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {picks.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="w-8 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {p.coverImage
                        ? <img src={resolveCoverSrc(p.id, p.coverImage)} alt={p.title} className="w-full h-full object-cover" />
                        : <BookOpen className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{p.title}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {p.author?.user?.displayName ?? p.author?.user?.username ?? ''}
                      </p>
                    </div>
                    <button
                      onClick={() => removePick(p.id)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${p.title}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            {picks.length < 4 && (
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQ}
                    onChange={e => handleSearchChange(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    placeholder="Search for a work to add..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-72 overflow-y-auto">
                    {searchResults.map(w => (
                      <button
                        key={w.id}
                        onClick={() => addPick(w)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left"
                      >
                        <div className="w-7 h-9 rounded overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          {w.coverImage
                            ? <img src={resolveCoverSrc(w.id, w.coverImage)} alt={w.title} className="w-full h-full object-cover" />
                            : <BookOpen className="w-3 h-3 text-gray-400" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{w.title}</p>
                          <p className="text-xs text-gray-500 truncate">{w.genres?.slice(0, 2).join(', ')}</p>
                        </div>
                        <span className="text-xs text-purple-500 font-medium flex-shrink-0">Add</span>
                      </button>
                    ))}
                  </div>
                )}

                {showDropdown && searchResults.length === 0 && searchQ.trim() && !searchLoading && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl px-4 py-3 text-sm text-gray-500">
                    No published works found for &ldquo;{searchQ}&rdquo;
                  </div>
                )}
              </div>
            )}

            {picks.length >= 4 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum 4 picks reached — remove one to add another.</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => router.push(`/creator/work/${workId}/chapters`)}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Manage Chapters
            </button>
            <button
              onClick={() => router.push(`/creator/work/${workId}/suggestions`)}
              className="flex-1 relative px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <Edit3 size={16} />
              Suggestions Inbox
              {pendingSuggestions > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full px-1">
                  {pendingSuggestions}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push(`/creator/works/${workId}/collaborators`)}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Collaborators
            </button>
            <button
              onClick={() => router.push('/creator/works')}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
