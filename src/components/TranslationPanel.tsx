'use client'

import { useState, useEffect } from 'react'
import { Globe, ThumbsUp, ThumbsDown, Plus, Edit3, Check, X, ChevronDown, ChevronUp, Languages, Star } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

// Types for translation system
export interface SentenceTranslation {
  id: string
  sentenceId: string
  originalText: string
  translatedText: string
  targetLanguage: string
  sourceLanguage: string
  votes: number
  userVote?: 'up' | 'down' | null
  translatorId: string
  translatorName: string
  translatorLevel?: 'community' | 'trusted' | 'official'
  createdAt: string
  version: number
}

export interface TranslationSuggestion {
  id: string
  translationId: string
  suggestedText: string
  reason?: string
  votes: number
  userVote?: 'up' | 'down' | null
  suggestedBy: string
  createdAt: string
}

interface TranslationPanelProps {
  blockId: string
  chapterId: string
  sentences: Array<{
    id: string
    text: string
    order: number
  }>
  currentLanguage: string
  targetLanguage: string
  onLanguageChange?: (language: string) => void
  userId?: string
  /** Pre-select and expand the sentence that contains this text (set by toolbar highlight action) */
  initialHighlightedText?: string
}

export default function TranslationPanel({
  blockId,
  chapterId,
  sentences,
  currentLanguage,
  targetLanguage,
  onLanguageChange,
  userId,
  initialHighlightedText
}: TranslationPanelProps) {
  
  const [translations, setTranslations] = useState<Map<string, SentenceTranslation[]>>(new Map())
  const [suggestions, setSuggestions] = useState<Map<string, TranslationSuggestion[]>>(new Map())
  const [expandedSentences, setExpandedSentences] = useState<Set<string>>(new Set())
  const [editingTranslation, setEditingTranslation] = useState<string | null>(null)
  const [newTranslationText, setNewTranslationText] = useState('')
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null)
  const [suggestionText, setSuggestionText] = useState('')
  const [suggestionReason, setSuggestionReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [translationMode, setTranslationMode] = useState<'auto' | 'community' | 'official'>('community')
  const { toast } = useToast()

  // Auto-expand and focus the sentence matching the toolbar highlight selection
  useEffect(() => {
    if (!initialHighlightedText || sentences.length === 0) return
    const needle = initialHighlightedText.toLowerCase()
    const match = sentences.find(
      (s) =>
        s.text.toLowerCase().includes(needle) ||
        needle.includes(s.text.toLowerCase().substring(0, 30))
    )
    if (match) {
      setExpandedSentences((prev) => new Set([...prev, match.id]))
      setEditingTranslation(match.id)
      setNewTranslationText('')
    }
  }, [initialHighlightedText, sentences])

  // Load translations for all sentences
  useEffect(() => {
    loadTranslations()
  }, [blockId, targetLanguage])

  const loadTranslations = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/translations?blockId=${blockId}&targetLanguage=${targetLanguage}`
      )
      
      if (response.ok) {
        const data = await response.json()
        const translationMap = new Map<string, SentenceTranslation[]>()
        
        data.translations.forEach((t: SentenceTranslation) => {
          const existing = translationMap.get(t.sentenceId) || []
          translationMap.set(t.sentenceId, [...existing, t])
        })
        
        setTranslations(translationMap)
      }
    } catch (error) {
      console.error('Failed to load translations:', error)
      toast.error('Failed to load translations')
    } finally {
      setLoading(false)
    }
  }

  const loadSuggestionsForTranslation = async (translationId: string) => {
    try {
      const response = await fetch(`/api/translations/${translationId}/suggestions`)
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(prev => new Map(prev).set(translationId, data.suggestions))
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
      toast.error('Failed to load suggestions')
    }
  }

  const submitTranslation = async (sentenceId: string, text: string) => {
    if (!userId) {
      toast.warning('Please sign in to submit translations')
      return
    }

    try {
      const sentence = sentences.find(s => s.id === sentenceId)
      if (!sentence) return

      const response = await fetch('/api/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockId,
          chapterId,
          sentenceId,
          originalText: sentence.text,
          translatedText: text,
          sourceLanguage: currentLanguage,
          targetLanguage,
          translatorId: userId
        })
      })

      if (response.ok) {
        setNewTranslationText('')
        setEditingTranslation(null)
        toast.success('Translation submitted!')
        loadTranslations()
      } else {
        toast.error('Failed to submit translation')
      }
    } catch (error) {
      console.error('Failed to submit translation:', error)
      toast.error('Failed to submit translation')
    }
  }

  const submitSuggestion = async (translationId: string) => {
    if (!userId) {
      toast.warning('Please sign in to submit suggestions')
      return
    }

    try {
      const response = await fetch('/api/translations/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translationId,
          suggestedText: suggestionText,
          reason: suggestionReason,
          suggestedBy: userId
        })
      })

      if (response.ok) {
        setSuggestionText('')
        setSuggestionReason('')
        setSuggestingFor(null)
        toast.success('Suggestion submitted!')
        loadSuggestionsForTranslation(translationId)
      } else {
        toast.error('Failed to submit suggestion')
      }
    } catch (error) {
      console.error('Failed to submit suggestion:', error)
      toast.error('Failed to submit suggestion')
    }
  }

  const voteOnTranslation = async (translationId: string, vote: 'up' | 'down') => {
    if (!userId) {
      toast.warning('Please sign in to vote')
      return
    }

    try {
      const response = await fetch('/api/translations/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translationId,
          userId,
          vote
        })
      })

      if (response.ok) {
        loadTranslations()
      } else {
        toast.error('Failed to record vote')
      }
    } catch (error) {
      console.error('Failed to vote:', error)
      toast.error('Failed to record vote')
    }
  }

  const voteOnSuggestion = async (suggestionId: string, vote: 'up' | 'down') => {
    if (!userId) {
      toast.warning('Please sign in to vote')
      return
    }

    try {
      const response = await fetch('/api/translations/suggestions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId,
          userId,
          vote
        })
      })

      if (response.ok) {
        // Reload suggestions
        const translationId = suggestions.entries().next().value?.[0]
        if (translationId) loadSuggestionsForTranslation(translationId)
      } else {
        toast.error('Failed to record vote')
      }
    } catch (error) {
      console.error('Failed to vote:', error)
      toast.error('Failed to record vote')
    }
  }

  const toggleSentence = (sentenceId: string) => {
    setExpandedSentences(prev => {
      const next = new Set(prev)
      if (next.has(sentenceId)) {
        next.delete(sentenceId)
      } else {
        next.add(sentenceId)
      }
      return next
    })
  }

  const getTranslatorBadge = (level?: 'community' | 'trusted' | 'official') => {
    switch (level) {
      case 'official':
        return <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1"><Star size={10} /> Official</span>
      case 'trusted':
        return <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1"><Check size={10} /> Trusted</span>
      case 'community':
      default:
        return <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Community</span>
    }
  }

  const getBestTranslation = (sentenceId: string): SentenceTranslation | null => {
    const sentenceTranslations = translations.get(sentenceId) || []
    if (sentenceTranslations.length === 0) return null

    // Filter by mode
    let filtered = sentenceTranslations
    if (translationMode === 'official') {
      filtered = sentenceTranslations.filter(t => t.translatorLevel === 'official')
    } else if (translationMode === 'community') {
      filtered = sentenceTranslations.filter(t => t.translatorLevel !== 'official')
    }

    // Sort by votes (descending)
    filtered.sort((a, b) => b.votes - a.votes)
    return filtered[0] || null
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Languages size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Translations</h3>
          </div>
          <button
            onClick={() => onLanguageChange?.(targetLanguage)}
            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
          >
            {targetLanguage.toUpperCase()}
          </button>
        </div>

        {/* Translation Mode Selector */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded p-1">
          <button
            onClick={() => setTranslationMode('community')}
            className={`flex-1 text-xs px-2 py-1.5 rounded transition-colors ${
              translationMode === 'community'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Community
          </button>
          <button
            onClick={() => setTranslationMode('auto')}
            className={`flex-1 text-xs px-2 py-1.5 rounded transition-colors ${
              translationMode === 'auto'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Auto
          </button>
          <button
            onClick={() => setTranslationMode('official')}
            className={`flex-1 text-xs px-2 py-1.5 rounded transition-colors ${
              translationMode === 'official'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Official
          </button>
        </div>
      </div>

      {/* Sentence List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading translations...</div>
        ) : sentences.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">No text to translate in this block</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sentences.map((sentence) => {
              const sentenceTranslations = translations.get(sentence.id) || []
              const bestTranslation = getBestTranslation(sentence.id)
              const isExpanded = expandedSentences.has(sentence.id)
              const isEditing = editingTranslation === sentence.id

              return (
                <div key={sentence.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* Original Text */}
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
                    {sentence.text}
                  </div>

                  {/* Best Translation */}
                  {bestTranslation && (
                    <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <div className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                        {bestTranslation.translatedText}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTranslatorBadge(bestTranslation.translatorLevel)}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            by {bestTranslation.translatorName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => voteOnTranslation(bestTranslation.id, 'up')}
                            className={`p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 ${
                              bestTranslation.userVote === 'up' ? 'text-blue-600' : 'text-gray-400'
                            }`}
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[20px] text-center">
                            {bestTranslation.votes}
                          </span>
                          <button
                            onClick={() => voteOnTranslation(bestTranslation.id, 'down')}
                            className={`p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 ${
                              bestTranslation.userVote === 'down' ? 'text-red-600' : 'text-gray-400'
                            }`}
                          >
                            <ThumbsDown size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-2">
                    {sentenceTranslations.length > 1 && (
                      <button
                        onClick={() => toggleSentence(sentence.id)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {sentenceTranslations.length} translations
                      </button>
                    )}
                    
                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingTranslation(sentence.id)
                          setNewTranslationText(bestTranslation?.translatedText || '')
                        }}
                        className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1"
                      >
                        <Plus size={12} />
                        Add translation
                      </button>
                    )}

                    {bestTranslation && !suggestingFor && (
                      <button
                        onClick={() => {
                          setSuggestingFor(bestTranslation.id)
                          setSuggestionText(bestTranslation.translatedText)
                        }}
                        className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1"
                      >
                        <Edit3 size={12} />
                        Suggest improvement
                      </button>
                    )}
                  </div>

                  {/* New Translation Form */}
                  {isEditing && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                      <textarea
                        value={newTranslationText}
                        onChange={(e) => setNewTranslationText(e.target.value)}
                        placeholder="Enter your translation..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => {
                            setEditingTranslation(null)
                            setNewTranslationText('')
                          }}
                          className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitTranslation(sentence.id, newTranslationText)}
                          disabled={!newTranslationText.trim()}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Suggestion Form */}
                  {suggestingFor && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Improved translation:
                      </label>
                      <textarea
                        value={suggestionText}
                        onChange={(e) => setSuggestionText(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded resize-none mb-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        rows={2}
                      />
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reason (optional):
                      </label>
                      <input
                        type="text"
                        value={suggestionReason}
                        onChange={(e) => setSuggestionReason(e.target.value)}
                        placeholder="Better grammar, more natural, etc."
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSuggestingFor(null)
                            setSuggestionText('')
                            setSuggestionReason('')
                          }}
                          className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitSuggestion(suggestingFor)}
                          disabled={!suggestionText.trim()}
                          className="px-3 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit Suggestion
                        </button>
                      </div>
                    </div>
                  )}

                  {/* All Translations (Expanded) */}
                  {isExpanded && sentenceTranslations.length > 1 && (
                    <div className="mt-3 space-y-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                      {sentenceTranslations
                        .filter(t => t.id !== bestTranslation?.id)
                        .map((translation) => (
                          <div
                            key={translation.id}
                            className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                          >
                            <div className="text-gray-900 dark:text-gray-100 mb-1">
                              {translation.translatedText}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getTranslatorBadge(translation.translatorLevel)}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {translation.translatorName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => voteOnTranslation(translation.id, 'up')}
                                  className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                    translation.userVote === 'up' ? 'text-blue-600' : 'text-gray-400'
                                  }`}
                                >
                                  <ThumbsUp size={12} />
                                </button>
                                <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[20px] text-center">
                                  {translation.votes}
                                </span>
                                <button
                                  onClick={() => voteOnTranslation(translation.id, 'down')}
                                  className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                    translation.userVote === 'down' ? 'text-red-600' : 'text-gray-400'
                                  }`}
                                >
                                  <ThumbsDown size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
