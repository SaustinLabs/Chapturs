'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface FavoriteAuthorConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

interface Author {
  id: string
  username: string
  displayName: string
  avatar?: string
  workCount: number
  followerCount: number
}

/**
 * FavoriteAuthorConfig - v0.2
 * Configuration modal for FavoriteAuthorBlock
 */
export default function FavoriteAuthorConfig({
  isOpen,
  onClose,
  onSave,
  initialData
}: FavoriteAuthorConfigProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Author[]>([])
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(initialData || null)
  const [isSearching, setIsSearching] = useState(false)
  const [customMessage, setCustomMessage] = useState(initialData?.customMessage || '')

  // Search for authors
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/authors/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        setSearchResults(data.authors || [])
      } catch (error) {
        console.error('Failed to search authors:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [searchQuery])

  const handleSelectAuthor = (author: Author) => {
    setSelectedAuthor(author)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSave = () => {
    if (!selectedAuthor) {
      toast.warning('Please select an author')
      return
    }

    onSave({
      authorId: selectedAuthor.id,
      authorUsername: selectedAuthor.username,
      authorDisplayName: selectedAuthor.displayName,
      authorAvatar: selectedAuthor.avatar,
      workCount: selectedAuthor.workCount,
      followerCount: selectedAuthor.followerCount,
      customMessage: customMessage.trim() || undefined
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Favorite Author" size="md">
      <div className="space-y-4">
        {/* Selected Author or Search */}
        {selectedAuthor ? (
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              {selectedAuthor.avatar ? (
                <img src={selectedAuthor.avatar} alt={selectedAuthor.displayName} className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-medium text-gray-100">{selectedAuthor.displayName}</h4>
                <p className="text-sm text-gray-400">@{selectedAuthor.username}</p>
              </div>
              <button
                onClick={() => setSelectedAuthor(null)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Change
              </button>
            </div>
            <div className="flex gap-4 text-xs text-gray-400">
              <span>{selectedAuthor.workCount} works</span>
              <span>{selectedAuthor.followerCount.toLocaleString()} followers</span>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search for Author *
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
              placeholder="Search by username or display name..."
            />
            
            {/* Search Results */}
            {searchQuery && (
              <div className="mt-2 max-h-60 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-gray-700">
                    {searchResults.map((author) => (
                      <button
                        key={author.id}
                        onClick={() => handleSelectAuthor(author)}
                        className="w-full p-3 hover:bg-gray-700 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          {author.avatar ? (
                            <img src={author.avatar} alt={author.displayName} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                              <span className="text-lg">👤</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-100 truncate">{author.displayName}</p>
                            <p className="text-sm text-gray-400">@{author.username}</p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {author.workCount} works
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    No authors found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Custom Message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Custom Message (optional)
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none resize-none"
            placeholder="Why do you recommend this author? (optional)"
            maxLength={200}
          />
          <p className="text-xs text-gray-500 text-right">{customMessage.length}/200</p>
        </div>

        {/* Preview */}
        {selectedAuthor && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preview
            </label>
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-3">
                {selectedAuthor.avatar ? (
                  <img src={selectedAuthor.avatar} alt={selectedAuthor.displayName} className="w-16 h-16 rounded-full border-2 border-purple-400" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-purple-700 flex items-center justify-center border-2 border-purple-400">
                    <span className="text-2xl">👤</span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white">{selectedAuthor.displayName}</h4>
                    <span className="text-yellow-400">⭐</span>
                  </div>
                  <p className="text-sm text-gray-300">@{selectedAuthor.username}</p>
                  <div className="flex gap-3 text-xs text-gray-400 mt-1">
                    <span>{selectedAuthor.workCount} works</span>
                    <span>•</span>
                    <span>{selectedAuthor.followerCount.toLocaleString()} followers</span>
                  </div>
                </div>
              </div>
              {customMessage && (
                <p className="text-sm text-gray-200 mb-3 italic">"{customMessage}"</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-sm text-purple-200">View Profile</span>
                <span className="text-purple-200">→</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedAuthor}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
