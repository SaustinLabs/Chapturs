'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  BookOpen, 
  List, 
  Users, 
  Eye, 
  ChevronRight,
  Edit,
  Plus,
  FileText
} from 'lucide-react'
import { ChaptDocument } from '@/types/chapt'
import { FeatureHint } from '@/components/ui/FeatureHint'

interface Chapter {
  id: string
  number: number
  title: string
  wordCount: number
  status: 'draft' | 'published'
}

interface GlossaryEntry {
  id: string
  term: string
  definition: string
  chapterIntroduced?: number
}

interface Character {
  id: string
  name: string
  role?: string
  description?: string
  physicalDescription?: string
  imageUrl?: string
  firstAppearance?: number
  aliases?: string[]
  personalityTraits?: string[]
  relationships?: string[]
}

interface EditorSidebarProps {
  isOpen: boolean
  onClose: () => void
  workId?: string
  currentChapterId?: string
  document?: ChaptDocument
  characters?: Character[]
  onCharacterRefresh?: () => void
  onNavigateToChapter?: (chapterId: string) => void
}

type SidebarTab = 'chapters' | 'glossary' | 'characters' | 'preview'

export default function EditorSidebar({
  isOpen,
  onClose,
  workId,
  currentChapterId,
  document,
  characters: propCharacters = [],
  onCharacterRefresh,
  onNavigateToChapter
}: EditorSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('chapters')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [glossaryEntries, setGlossaryEntries] = useState<GlossaryEntry[]>([])
  const [loading, setLoading] = useState(false)
  
  // Load chapters when sidebar opens
  useEffect(() => {
    if (isOpen && workId && activeTab === 'chapters') {
      loadChapters()
    }
  }, [isOpen, workId, activeTab])
  
  // Load glossary when tab is selected
  useEffect(() => {
    if (isOpen && workId && activeTab === 'glossary') {
      loadGlossary()
    }
  }, [isOpen, workId, activeTab])

  const loadChapters = async () => {
    if (!workId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/works/${workId}/sections`)
      if (response.ok) {
        const result = await response.json()
        const sectionsArray = result.sections || []
        setChapters(sectionsArray.map((s: any) => ({
          id: s.id,
          number: s.chapterNumber || 0,
          title: s.title || 'Untitled',
          wordCount: s.wordCount || 0,
          status: s.status || 'draft'
        })))
      }
    } catch (error) {
      console.error('Error loading chapters:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGlossary = async () => {
    if (!workId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/works/${workId}/glossary`)
      if (response.ok) {
        const data = await response.json()
        setGlossaryEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Error loading glossary:', error)
      // Set empty for now if API doesn't exist yet
      setGlossaryEntries([])
    } finally {
      setLoading(false)
    }
  }

  const renderPreview = () => {
    if (!document || !document.content) {
      return (
        <div className="text-center text-gray-500 py-8">
          <Eye size={48} className="mx-auto mb-4 opacity-50" />
          <p>No content to preview</p>
        </div>
      )
    }

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {document.content.map((block: any, index: number) => {
          if (block.type === 'prose') {
            return (
              <div key={block.id || index} className="mb-4">
                {block.text}
              </div>
            )
          }
          if (block.type === 'heading') {
            const level = block.level || 2
            const headingClass = "font-bold mt-6 mb-3"
            if (level === 1) return <h1 key={block.id || index} className={headingClass}>{block.text}</h1>
            if (level === 2) return <h2 key={block.id || index} className={headingClass}>{block.text}</h2>
            if (level === 3) return <h3 key={block.id || index} className={headingClass}>{block.text}</h3>
            if (level === 4) return <h4 key={block.id || index} className={headingClass}>{block.text}</h4>
            return <h2 key={block.id || index} className={headingClass}>{block.text}</h2>
          }
          if (block.type === 'dialogue') {
            return (
              <div key={block.id || index} className="mb-4 pl-4 border-l-2 border-blue-400">
                {block.speaker && (
                  <div className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                    {block.speaker}
                  </div>
                )}
                <div className="italic">{block.text}</div>
              </div>
            )
          }
          return null
        })}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div 
      className="absolute right-0 top-[57px] bottom-0 w-96 bg-gray-100 dark:bg-gray-800 border-l border-gray-300 dark:border-gray-700 shadow-xl z-10 flex flex-col transform transition-transform"
      style={{ height: 'calc(100% - 57px)' }}
    >
      {/* Header - Simple without close button since we have the floating toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 dark:border-gray-700 bg-gray-800 dark:bg-gray-900">
        <h2 className="text-base font-semibold text-white">
          Resources
        </h2>
      </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800">
          <button
            onClick={() => setActiveTab('chapters')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chapters'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-700'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <List size={16} className="inline mr-1" />
            Chapters
          </button>
          <button
            onClick={() => setActiveTab('glossary')}
            className={`flex-1 px-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'glossary'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-700'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BookOpen size={16} className="inline mr-1" />
            Glossary
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`flex-1 px-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'characters'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-700'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users size={16} className="inline mr-1" />
            Characters
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 px-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-700'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Eye size={16} className="inline mr-1" />
            Preview
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Chapters Tab */}
              {activeTab === 'chapters' && (
                <div className="space-y-2">
                  {chapters.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <FileText size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No chapters yet</p>
                    </div>
                  ) : (
                    chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          chapter.id === currentChapterId
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => onNavigateToChapter?.(chapter.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Chapter {chapter.number}
                              </span>
                              {chapter.status === 'published' && (
                                <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                                  Published
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                              {chapter.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {chapter.wordCount.toLocaleString()} words
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-gray-400 mt-1" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Glossary Tab */}
              {activeTab === 'glossary' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug flex-1">Define world terms — readers hover highlighted words to see your definitions.</p>
                    <FeatureHint title="About the Glossary" side="left">
                      <p>Define terms, places, and concepts from your world. When you highlight a word in a chapter and link it to a glossary entry, readers can hover over it while reading to see your definition.</p>
                      <p>A powerful way to build immersion without breaking the flow of your story.</p>
                    </FeatureHint>
                  </div>
                  <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center">
                    <Plus size={16} className="mr-2" />
                    Add Term
                  </button>
                  
                  {glossaryEntries.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No glossary entries yet</p>
                      <p className="text-sm mt-2">Add terms to help readers understand your world</p>
                    </div>
                  ) : (
                    glossaryEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {entry.term}
                          </h4>
                          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                            <Edit size={14} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {entry.definition}
                        </p>
                        {entry.chapterIntroduced && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            Introduced in Chapter {entry.chapterIntroduced}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Characters Tab */}
              {activeTab === 'characters' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug flex-1">Build cast profiles &mdash; readers see each character on your story page.</p>
                    <FeatureHint title="About Characters" side="left">
                      <p>Create profile cards for your cast &mdash; name, role, appearance, and portrait. Character profiles are visible on your story page so readers always know who&apos;s who.</p>
                      <p>You can also tag characters within a chapter, and readers can submit fan art linked to specific characters.</p>
                    </FeatureHint>
                  </div>
                  {propCharacters.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Users size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No characters yet</p>
                      <p className="text-sm mt-2">Select a character name in the editor and click &quot;Character&quot; to add a profile</p>
                    </div>
                  ) : (
                    propCharacters.map((character) => (
                      <div key={character.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <div className="flex items-start gap-3">
                          {character.imageUrl ? (
                            <img
                              src={character.imageUrl}
                              alt={character.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                              <Users size={24} className="text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {character.name}
                            </div>
                            {character.role && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 capitalize mt-0.5">
                                {character.role.replace('_', ' ')}
                              </div>
                            )}
                            {character.firstAppearance && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                First appeared: Ch. {character.firstAppearance}
                              </p>
                            )}
                            {character.physicalDescription && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                {character.physicalDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Preview Tab */}
              {activeTab === 'preview' && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-full">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    {document?.metadata?.title || 'Preview'}
                  </h3>
                  {renderPreview()}
                </div>
              )}
            </>
          )}
        </div>
    </div>
  )
}
