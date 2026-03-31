'use client'

import { useUser } from '@/hooks/useUser'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft, Search, Plus, Edit2, Trash2, Image as ImageIcon,
  Loader2, Users, BookOpen, Star
} from 'lucide-react'
import Link from 'next/link'
import CharacterModal from './CharacterModal'
import PretextClampText from './PretextClampText'

interface CharacterProfile {
  id: string
  name: string
  role?: string
  imageUrl?: string
  quickGlance?: string
  physicalDescription?: string
  personality?: string
  backstory?: string
  motivations?: string
  characterArc?: string
  aliases?: string
  firstAppearance?: number
  allowUserSubmissions: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    imageSubmissions: number
  }
}

interface Work {
  id: string
  title: string
}

export default function WorkCharactersPage() {
  const params = useParams()
  const { isAuthenticated, isLoading: userLoading } = useUser()
  const [work, setWork] = useState<Work | null>(null)
  const [characters, setCharacters] = useState<CharacterProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<CharacterProfile | null>(null)

  const workId = params.id as string

  useEffect(() => {
    if (isAuthenticated && workId) {
      fetchWorkAndCharacters()
    }
  }, [isAuthenticated, workId])

  const fetchWorkAndCharacters = async () => {
    setLoading(true)
    try {
      // Fetch work details
      const workRes = await fetch(`/api/works/${workId}`)
      if (!workRes.ok) throw new Error('Work not found')
      const workData = await workRes.json()
      setWork(workData)

      // Fetch characters
      const charsRes = await fetch(`/api/works/${workId}/characters`)
      if (!charsRes.ok) throw new Error('Failed to fetch characters')
      const charsData = await charsRes.json()
      setCharacters(charsData.characters || [])
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (characterId: string) => {
    if (!confirm('Are you sure you want to delete this character? This will also delete all associated fanart submissions.')) return

    try {
      const res = await fetch(`/api/works/${workId}/characters/${characterId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete')
      
      // Refresh list
      await fetchWorkAndCharacters()
    } catch (error) {
      console.error('Failed to delete character:', error)
      alert('Failed to delete character')
    }
  }

  // Get unique roles
  const roles = ['all', ...new Set(characters.map(c => c.role).filter(Boolean) as string[])]

  // Filter characters
  const filteredCharacters = characters.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         char.aliases?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || char.role === roleFilter
    return matchesSearch && matchesRole
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
          <Users className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unauthorized</h2>
          <p className="text-gray-600 dark:text-gray-400">Please sign in to manage characters.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header with Back Button */}
      <div className="mb-6">
        <Link
          href="/creator/characters"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-4"
        >
          <ArrowLeft size={20} />
          Back to Stories
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {work?.title || 'Loading...'} - Characters
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage interactive character profiles for this story
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Character
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Characters</p>
              <p className="text-2xl font-bold text-purple-600">{characters.length}</p>
            </div>
            <Users className="text-purple-500" size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Fanart</p>
              <p className="text-2xl font-bold text-pink-600">
                {characters.reduce((sum, c) => sum + (c._count?.imageSubmissions || 0), 0)}
              </p>
            </div>
            <ImageIcon className="text-pink-500" size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Roles</p>
              <p className="text-2xl font-bold text-blue-600">{roles.length - 1}</p>
            </div>
            <Star className="text-blue-500" size={24} />
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
              placeholder="Search characters or aliases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          {roles.length > 1 && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Characters Grid */}
      {filteredCharacters.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <Users className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {characters.length === 0 ? 'No Characters Yet' : 'No Results Found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {characters.length === 0 
              ? 'Start adding character profiles to bring your story to life.'
              : 'Try adjusting your search or filter.'}
          </p>
          {characters.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={16} />
              Add First Character
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharacters.map((character) => (
            <div
              key={character.id}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
            >
              {/* Character Image */}
              <div className="aspect-square bg-gray-100 dark:bg-gray-900 relative">
                {character.imageUrl ? (
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="text-gray-400" size={64} />
                  </div>
                )}
                {character.role && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 text-xs rounded-full font-semibold">
                    {character.role}
                  </div>
                )}
              </div>

              {/* Character Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {character.name}
                </h3>
                {character.aliases && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    aka {character.aliases}
                  </p>
                )}
                {character.quickGlance && (
                  <PretextClampText
                    as="p"
                    text={character.quickGlance}
                    lineClamp={2}
                    font="14px Inter"
                    lineHeight={20}
                    className="text-sm text-gray-700 dark:text-gray-300 mb-3"
                  />
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {character.firstAppearance && (
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      Chapter {character.firstAppearance}
                    </span>
                  )}
                  {character._count && character._count.imageSubmissions > 0 && (
                    <span className="flex items-center gap-1">
                      <ImageIcon size={12} />
                      {character._count.imageSubmissions} fanart
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCharacter(character)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(character.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <CharacterModal
          workId={workId}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchWorkAndCharacters}
        />
      )}
      {editingCharacter && (
        <CharacterModal
          workId={workId}
          character={editingCharacter}
          onClose={() => setEditingCharacter(null)}
          onSuccess={fetchWorkAndCharacters}
        />
      )}
    </div>
  )
}
