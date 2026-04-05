'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { LinkIcon, ClipboardDocumentIcon, TrashIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'

const AVAILABLE_GENRES = [
  'Fantasy', 'Science Fiction', 'Romance', 'Mystery', 'Thriller',
  'Horror', 'Historical Fiction', 'Literary Fiction', 'Young Adult',
  'Adventure', 'Comedy', 'Drama',
  'LitRPG', 'Progression Fantasy', 'Cultivation / Xianxia', 'Isekai',
  'Wuxia', 'Dungeon Core', 'Harem', 'Web Fiction',
]

interface CommunityLink {
  id: string
  slug: string
  label: string
  description: string | null
  genres: string | null
  clickCount: number
  signupCount: number
  active: boolean
  createdAt: string
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function CommunityLinksPage() {
  const { toast } = useToast()
  const [links, setLinks] = useState<CommunityLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const [label, setLabel] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [description, setDescription] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])

  const fetchLinks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/admin/community-links')
      if (res.ok) {
        const data = await res.json()
        setLinks(data.data.links)
      }
    } catch {
      if (!silent) toast.error('Failed to load community links.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [toast])

  // Initial load + 30-second polling for near-real-time click/signup counts
  useEffect(() => {
    fetchLinks()
    const interval = setInterval(() => fetchLinks(true), 30_000)
    return () => clearInterval(interval)
  }, [fetchLinks])

  // Auto-generate slug from label unless user has manually overridden it
  useEffect(() => {
    if (!slugManual) setSlug(slugify(label))
  }, [label, slugManual])

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    )
  }

  const handleGenerate = async () => {
    if (!label || !slug) {
      toast.warning('Community name and slug are required.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/community-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, label, description, genres: selectedGenres }),
      })
      if (res.ok) {
        const data = await res.json()
        const url = `${window.location.origin}/join/${data.data.link.slug}`
        await navigator.clipboard.writeText(url)
        toast.success('Link created and copied to clipboard!')
        setLabel('')
        setSlug('')
        setSlugManual(false)
        setDescription('')
        setSelectedGenres([])
        fetchLinks()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create link.')
      }
    } catch {
      toast.error('Network error.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async (link: CommunityLink) => {
    const url = `${window.location.origin}/join/${link.slug}`
    await navigator.clipboard.writeText(url)
    setCopied(link.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this community link? Existing visitors with the cookie will still have their genre weights.')) return
    try {
      const res = await fetch(`/api/admin/community-links?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Link deleted.')
        fetchLinks()
      } else {
        toast.error('Failed to delete link.')
      }
    } catch {
      toast.error('Network error.')
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://chapturs.com'

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
            <LinkIcon className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Community Links</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Generate named invite links. Visitors' feeds are pre-seeded to their community's genres.
            </p>
          </div>
        </div>

        {/* Generator Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-xl">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <PlusIcon className="w-5 h-5" /> New Community Link
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Label */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                Community Name
              </label>
              <input
                type="text"
                placeholder="e.g. Royal Road – LitRPG Discord"
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                URL Slug
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">/join/</span>
                <input
                  type="text"
                  placeholder="royalroad-litrpg"
                  value={slug}
                  onChange={e => { setSlug(e.target.value); setSlugManual(true) }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              {slug && (
                <p className="text-xs text-gray-400 mt-1 truncate font-mono">
                  {origin}/join/{slug}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
              Admin Notes (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Posted in #general on 4 Apr 2026"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Genre selector */}
          <div className="mb-8">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
              Genre Interests (pre-seeds feed)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                    selectedGenres.includes(g)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={saving || !label || !slug}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black px-6 py-3 rounded-2xl transition-colors text-sm"
          >
            {saving ? (
              <span className="animate-spin rounded-full w-4 h-4 border-b-2 border-white" />
            ) : (
              <ClipboardDocumentIcon className="w-4 h-4" />
            )}
            Generate & Copy Link
          </button>
        </div>

        {/* Existing links table */}
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Active Links</h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
            </div>
          ) : links.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-12 text-center">
              <LinkIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No community links yet. Generate your first one above.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xl divide-y divide-gray-100 dark:divide-gray-800">
              {links.map(link => {
                const genres: string[] = link.genres ? JSON.parse(link.genres) : []
                return (
                  <div key={link.id} className="px-8 py-5 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-black text-gray-900 dark:text-white truncate">{link.label}</p>
                        {!link.active && (
                          <span className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-blue-500 mb-2 truncate">
                        {origin}/join/{link.slug}
                      </p>
                      {genres.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {genres.map(g => (
                            <span key={g} className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full">{g}</span>
                          ))}
                        </div>
                      )}
                      {link.description && (
                        <p className="text-xs text-gray-400 mt-1">{link.description}</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0 space-y-2">
                      <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{link.clickCount.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">clicks</p>
                      </div>
                      <div>
                        <p className="text-xl font-black text-green-500 leading-none">{link.signupCount.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">signups</p>
                      </div>
                      <p className="text-[10px] text-gray-400">{new Date(link.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(link)}
                        className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                        title="Copy link"
                      >
                        {copied === link.id
                          ? <CheckIcon className="w-4 h-4 text-green-500" />
                          : <ClipboardDocumentIcon className="w-4 h-4 text-gray-500" />
                        }
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                        title="Delete link"
                      >
                        <TrashIcon className="w-4 h-4 text-gray-500 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
