'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { ChaptDocument, ContentBlock, ProseBlock, HeadingBlock, DialogueBlock, ChatBlock, PhoneBlock, NarrationBlock, PacingAnimation } from '@/types/chapt'
import { ChatBlockEditor, PhoneBlockEditor, DialogueBlockEditor, NarrationBlockEditor } from './BlockEditors'
import { MessageCircle, Globe, BookmarkPlus, Share2, MessageSquare, Edit3, PanelRight, X } from 'lucide-react'
import TranslationPanel from './TranslationPanel'
import InlineBlockComments from './InlineBlockComments'
import EditSuggestionModal from './EditSuggestionModal'
import SelectionActionToolbar from './SelectionActionToolbar'
import CharacterProfileViewModal from './CharacterProfileViewModal'
import { useMeasureTextHeight } from '@/hooks/usePretext'
import { buildReaderSelectionActions } from '@/lib/selectionActionRegistry'
import { SelectionRole } from '@/lib/selectionActionRegistry'

interface ReaderCharacter {
  id: string
  name: string
  aliases?: string[]
  allowUserSubmissions?: boolean
  workId?: string
  [key: string]: any
}

interface ChaptursReaderProps {
  document: ChaptDocument
  onBookmark?: () => void
  onShare?: (blockId: string, text: string) => void
  onComment?: (blockId: string) => void
  onEditSuggestion?: (blockId: string, originalText: string) => void
  enableTranslation?: boolean
  enableCollaboration?: boolean // Enable comments and edit suggestions
  userLanguage?: string // User's preferred language for dual-language display
  currentUserId?: string
  currentUserName?: string
  viewerRole?: SelectionRole
  onFanArtIntent?: (term: string, blockId: string) => void
  workId?: string
  characters?: ReaderCharacter[]
}

export default function ChaptursReader({
  document,
  onBookmark,
  onShare,
  onComment,
  onEditSuggestion,
  enableTranslation = false,
  enableCollaboration = false,
  userLanguage = 'en',
  currentUserId,
  currentUserName,
  viewerRole = 'reader',
  onFanArtIntent,
  workId,
  characters
}: ChaptursReaderProps) {
  
  const [activeLanguage, setActiveLanguage] = useState<string>(document.metadata.language)
  const [showDualLanguage, setShowDualLanguage] = useState(false)
  const [visibleBlocks, setVisibleBlocks] = useState<Set<string>>(new Set())
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null)
  
  // Translation & Collaboration State
  const [showTranslationPanel, setShowTranslationPanel] = useState(false)
  const [activeBlockForTranslation, setActiveBlockForTranslation] = useState<string | null>(null)
  const [showBlockComments, setShowBlockComments] = useState(false)
  const [activeBlockForComments, setActiveBlockForComments] = useState<string | null>(null)
  const [blockCommentCounts, setBlockCommentCounts] = useState<Map<string, number>>(new Map())
  const [showEditSuggestionModal, setShowEditSuggestionModal] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectedBlockId, setSelectedBlockId] = useState('')
  const [selectionPosition, setSelectionPosition] = useState({ top: 0, left: 0 })
  const [knownCharacters, setKnownCharacters] = useState<ReaderCharacter[]>(characters || [])
  const [selectedCharacter, setSelectedCharacter] = useState<ReaderCharacter | null>(null)
  const [fanArtCharacterOptions, setFanArtCharacterOptions] = useState<ReaderCharacter[]>([])
  
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Initialize Intersection Observer for scroll-based animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const blockId = entry.target.getAttribute('data-block-id')
            if (blockId) {
              setVisibleBlocks((prev) => new Set([...prev, blockId]))
            }
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // Text selection handler for edit suggestions
  useEffect(() => {
    if (!enableCollaboration) return

    const handleTextSelection = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        return
      }

      const selectedString = selection.toString().trim()
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      // Find the block ID from the selection
      let element = range.commonAncestorContainer as HTMLElement
      if (element.nodeType === 3) {
        element = element.parentElement as HTMLElement
      }

      const blockElement = element.closest('[data-block-id]')
      if (blockElement) {
        const blockId = blockElement.getAttribute('data-block-id')
        if (blockId) {
          setSelectedText(selectedString)
          setSelectedBlockId(blockId)
          setSelectionPosition({
            top: rect.bottom + window.scrollY + 10,
            left: rect.left + window.scrollX
          })
        }
      }
    }

    // Use globalThis.document to avoid shadowing the ChaptDocument parameter
    globalThis.document.addEventListener('mouseup', handleTextSelection)
    globalThis.document.addEventListener('touchend', handleTextSelection)

    return () => {
      globalThis.document.removeEventListener('mouseup', handleTextSelection)
      globalThis.document.removeEventListener('touchend', handleTextSelection)
    }
  }, [enableCollaboration])

  useEffect(() => {
    if (characters && characters.length > 0) {
      setKnownCharacters(characters)
      return
    }

    // Best-effort character loading; this may fail for unauthenticated readers and will silently no-op.
    const resolvedWorkId = workId || document.metadata.id
    const currentChapter = document.metadata.chapterNumber || 999999

    const loadCharacters = async () => {
      try {
        const response = await fetch(`/api/works/${resolvedWorkId}/characters?chapter=${currentChapter}`)
        if (!response.ok) return

        const data = await response.json()
        if (data?.success && Array.isArray(data.characters)) {
          const normalized = data.characters.map((char: ReaderCharacter) => ({
            ...char,
            workId: char.workId || resolvedWorkId
          }))
          setKnownCharacters(normalized)
        }
      } catch {
        // Keep reader resilient if character API is unavailable for current viewer context.
      }
    }

    loadCharacters()
  }, [workId, characters, document.metadata.id, document.metadata.chapterNumber])

  // Load comments for all blocks
  useEffect(() => {
    if (!enableCollaboration) return

    const loadComments = async () => {
      try {
        const response = await fetch(
          `/api/comments?chapterId=${document.metadata.id}&resolved=false`
        )
        if (response.ok) {
          const data = await response.json()
          const countsByBlock = new Map<string, number>()
          
          data.comments.forEach((comment: any) => {
            const currentCount = countsByBlock.get(comment.blockId) || 0
            countsByBlock.set(comment.blockId, currentCount + 1)
          })
          
          setBlockCommentCounts(countsByBlock)
        }
      } catch (error) {
        console.error('Failed to load comments:', error)
      }
    }

    loadComments()
  }, [document.metadata.id, enableCollaboration])

  // Language toggle handler
  const toggleLanguage = () => {
    if (showDualLanguage) {
      setShowDualLanguage(false)
    } else if (activeLanguage === document.metadata.language) {
      setActiveLanguage(userLanguage)
    } else {
      setActiveLanguage(document.metadata.language)
    }
  }

  const toggleDualLanguage = () => {
    setShowDualLanguage(!showDualLanguage)
  }

  const handleOpenCommentThread = (blockId: string) => {
    setActiveBlockForComments(blockId)
    setShowBlockComments(true)
  }

  const handleOpenTranslationPanel = (blockId: string) => {
    setActiveBlockForTranslation(blockId)
    setShowTranslationPanel(true)
  }

  const clearSelection = () => {
    setSelectedText('')
    setSelectedBlockId('')
  }

  const resolveCharacterFromSelection = () => {
    const selected = selectedText.trim().toLowerCase()
    if (!selected) return null

    return (
      knownCharacters.find((char) => {
        const directMatch = char.name?.toLowerCase() === selected
        const aliasMatch = Array.isArray(char.aliases)
          ? char.aliases.some((alias) => alias.toLowerCase() === selected)
          : false
        return directMatch || aliasMatch
      }) || null
    )
  }

  const getFuzzyCharacterMatches = () => {
    const selected = selectedText.trim().toLowerCase()
    if (!selected) return []

    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
    const selectedNormalized = normalize(selected)
    const selectedTokens = selectedNormalized.split(/\s+/).filter(Boolean)

    const scored = knownCharacters
      .map((char) => {
        const candidateNames = [char.name, ...(char.aliases || [])].filter(Boolean)
        const bestScore = candidateNames.reduce((score, rawCandidate) => {
          const candidate = normalize(rawCandidate)
          if (!candidate) return score

          if (candidate === selectedNormalized) return Math.max(score, 1)
          if (candidate.startsWith(selectedNormalized) || selectedNormalized.startsWith(candidate)) {
            return Math.max(score, 0.88)
          }
          if (candidate.includes(selectedNormalized) || selectedNormalized.includes(candidate)) {
            return Math.max(score, 0.76)
          }

          const candidateTokens = candidate.split(/\s+/).filter(Boolean)
          const overlap = selectedTokens.filter((token) => candidateTokens.includes(token)).length
          if (overlap > 0) {
            const tokenScore = overlap / Math.max(selectedTokens.length, candidateTokens.length)
            return Math.max(score, tokenScore * 0.74)
          }

          return score
        }, 0)

        return { char, score: bestScore }
      })
      .filter((entry) => entry.score >= 0.55)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    return scored.map((entry) => entry.char)
  }

  const openCharacterProfile = (character: ReaderCharacter) => {
    setSelectedCharacter({
      ...character,
      workId: character.workId || workId || document.metadata.id
    })
  }

  const handleFanArtIntent = () => {
    if (onFanArtIntent) {
      onFanArtIntent(selectedText, selectedBlockId)
      clearSelection()
      return
    }

    const matchedCharacter = resolveCharacterFromSelection()
    if (matchedCharacter) {
      openCharacterProfile(matchedCharacter)
      clearSelection()
      return
    }

    const fuzzyMatches = getFuzzyCharacterMatches()
    if (fuzzyMatches.length === 1) {
      openCharacterProfile(fuzzyMatches[0])
      clearSelection()
      return
    }

    if (fuzzyMatches.length > 1) {
      setFanArtCharacterOptions(fuzzyMatches)
      clearSelection()
      return
    }

    alert('Fan art submission is character-specific. Click a highlighted character profile and use Submit Fan Art there.')
    clearSelection()
  }

  const handleTextSelectionAction = (action: 'comment' | 'suggest' | 'translate') => {
    if (action === 'suggest') {
      setShowEditSuggestionModal(true)
    } else if (action === 'comment') {
      handleOpenCommentThread(selectedBlockId)
      clearSelection()
    } else if (action === 'translate') {
      handleOpenTranslationPanel(selectedBlockId)
      clearSelection()
    }
  }

  const selectionActions = useMemo(
    () =>
      buildReaderSelectionActions({
        role: viewerRole,
        enableCollaboration,
        enableTranslation,
        onComment: () => handleTextSelectionAction('comment'),
        onSuggestEdit: () => handleTextSelectionAction('suggest'),
        onSuggestTranslation: () => handleTextSelectionAction('translate'),
        onFanArt: handleFanArtIntent
      }),
    [viewerRole, enableCollaboration, enableTranslation, selectedBlockId, selectedText]
  )

  // Parse block text into sentences for translation
  const extractSentences = (text: string): Array<{ id: string; text: string; order: number }> => {
    const sentencePattern = /[^.!?]+[.!?]+/g
    const sentences = text.match(sentencePattern) || [text]
    
    return sentences.map((sentence, index) => ({
      id: `sentence-${index}`,
      text: sentence.trim(),
      order: index
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative">
      {/* Reader Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{document.metadata.title}</h1>
              <p className="text-sm text-gray-500">
                by {document.metadata.author.name} · {document.metadata.wordCount} words
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Controls */}
              {enableTranslation && (
                <>
                  <button
                    onClick={toggleLanguage}
                    className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
                    title="Switch language"
                  >
                    <Globe size={16} />
                    {activeLanguage.toUpperCase()}
                  </button>
                  
                  <button
                    onClick={toggleDualLanguage}
                    className={`px-3 py-2 text-sm border rounded flex items-center gap-2 ${
                      showDualLanguage 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    title="Show both languages"
                  >
                    Dual
                  </button>
                </>
              )}

              {/* Translation Panel Toggle */}
              {enableTranslation && (
                <button
                  onClick={() => setShowTranslationPanel(!showTranslationPanel)}
                  className={`p-2 rounded flex items-center gap-2 ${
                    showTranslationPanel
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Translation panel"
                >
                  <PanelRight size={20} />
                </button>
              )}

              {/* Action Buttons */}
              {onBookmark && (
                <button
                  onClick={onBookmark}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  title="Bookmark"
                >
                  <BookmarkPlus size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout with Sidebar */}
      <div className="flex relative">
        {/* Reader Content */}
        <div className={`flex-1 transition-all ${showTranslationPanel ? 'mr-96' : ''}`}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <article className="prose prose-lg max-w-none">
          {document.content.map((block, index) => {
            const blockCommentCount = blockCommentCounts.get(block.id) || 0
            
            return (
              <div key={block.id} className="relative group">
                {/* Block comment indicator */}
                {enableCollaboration && blockCommentCount > 0 && (
                  <button
                    onClick={() => handleOpenCommentThread(block.id)}
                    className="absolute -left-10 top-0 p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
                    title={`${blockCommentCount} comment${blockCommentCount > 1 ? 's' : ''}`}
                  >
                    <MessageSquare size={16} />
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {blockCommentCount}
                    </span>
                  </button>
                )}
                
                <ReadableBlock
                  block={block}
                  index={index}
                  isVisible={visibleBlocks.has(block.id)}
                  isHovered={hoveredBlock === block.id}
                  observerRef={observerRef}
                  activeLanguage={activeLanguage}
                  showDualLanguage={showDualLanguage}
                  translations={document.translations}
                  enableCollaboration={enableCollaboration}
                  onHover={() => setHoveredBlock(block.id)}
                  onLeave={() => setHoveredBlock(null)}
                  onShare={onShare ? (text) => onShare(block.id, text) : undefined}
                  onComment={enableCollaboration ? () => handleOpenCommentThread(block.id) : undefined}
                  onEditSuggestion={enableCollaboration ? (text) => setShowEditSuggestionModal(true) : undefined}
                  onOpenTranslation={enableTranslation ? () => handleOpenTranslationPanel(block.id) : undefined}
                />
              </div>
            )
          })}
        </article>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-6 py-8 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            Published on {new Date(document.metadata.created).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:text-gray-900">Report Issue</button>
            {enableTranslation && (
              <button 
                onClick={() => setShowTranslationPanel(true)}
                className="hover:text-gray-900"
              >
                Suggest Translation
              </button>
            )}
          </div>
        </div>
      </div>
        </div>

        {/* Translation Panel Sidebar */}
        {showTranslationPanel && enableTranslation && (
          <div className="fixed right-0 top-0 h-screen w-96 z-40">
            <TranslationPanel
              blockId={activeBlockForTranslation || document.content[0]?.id || ''}
              chapterId={document.metadata.id}
              sentences={activeBlockForTranslation ? extractSentences(
                (document.content.find(b => b.id === activeBlockForTranslation) as ProseBlock)?.text || ''
              ) : []}
              currentLanguage={document.metadata.language}
              targetLanguage={userLanguage}
              onLanguageChange={setActiveLanguage}
              userId={currentUserId}
            />
          </div>
        )}
      </div>

      {/* Inline Block Comments Overlay */}
      {showBlockComments && activeBlockForComments && enableCollaboration && (
        <div className="fixed inset-y-0 right-0 w-80 z-50 transform transition-transform shadow-2xl">
          <InlineBlockComments
            workId={document.metadata.id}
            sectionId={document.metadata.id}
            blockId={activeBlockForComments}
            currentUserId={currentUserId}
            currentUsername={currentUserName}
            isOpen={showBlockComments}
            onClose={() => {
              setShowBlockComments(false)
              setActiveBlockForComments(null)
            }}
          />
        </div>
      )}

      {/* Edit Suggestion Modal */}
      {showEditSuggestionModal && selectedText && enableCollaboration && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-20">
          <EditSuggestionModal
            blockId={selectedBlockId}
            chapterId={document.metadata.id}
            workId={document.metadata.id}
            selectedText={selectedText}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onClose={() => {
              setShowEditSuggestionModal(false)
              setSelectedText('')
              setSelectedBlockId('')
            }}
            position={selectionPosition}
          />
        </div>
      )}

      {/* Text Selection Toolbar */}
      <SelectionActionToolbar
        visible={Boolean(selectedText && enableCollaboration && !showEditSuggestionModal)}
        position={selectionPosition}
        actions={selectionActions}
        onClose={clearSelection}
      />

      {selectedCharacter && (
        <CharacterProfileViewModal
          character={selectedCharacter}
          isOpen={Boolean(selectedCharacter)}
          onClose={() => setSelectedCharacter(null)}
        />
      )}

      {fanArtCharacterOptions.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Choose Character</h3>
                <p className="text-sm text-gray-600">Select who this fan art is for.</p>
              </div>
              <button
                onClick={() => setFanArtCharacterOptions([])}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {fanArtCharacterOptions.map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    openCharacterProfile(character)
                    setFanArtCharacterOptions([])
                  }}
                  className="w-full text-left px-3 py-2 rounded border border-gray-200 hover:bg-gray-50"
                >
                  <div className="font-medium text-gray-900">{character.name}</div>
                  {character.aliases && character.aliases.length > 0 && (
                    <div className="text-xs text-gray-500">aka {character.aliases.slice(0, 3).join(', ')}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// READABLE BLOCK COMPONENT
// ============================================================================

interface ReadableBlockProps {
  block: ContentBlock
  index: number
  isVisible: boolean
  isHovered: boolean
  observerRef: React.MutableRefObject<IntersectionObserver | null>
  activeLanguage: string
  showDualLanguage: boolean
  translations?: ChaptDocument['translations']
  enableCollaboration?: boolean
  onHover: () => void
  onLeave: () => void
  onShare?: (text: string) => void
  onComment?: () => void
  onEditSuggestion?: (text: string) => void
  onOpenTranslation?: () => void
}

function ReadableBlock({
  block,
  index,
  isVisible,
  isHovered,
  observerRef,
  activeLanguage,
  showDualLanguage,
  translations,
  enableCollaboration,
  onHover,
  onLeave,
  onShare,
  onComment,
  onEditSuggestion,
  onOpenTranslation
}: ReadableBlockProps) {
  
  const blockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = blockRef.current
    if (element && observerRef.current) {
      observerRef.current.observe(element)
    }

    return () => {
      if (element && observerRef.current) {
        observerRef.current.unobserve(element)
      }
    }
  }, [observerRef])

  // Get animation style for this block
  const getAnimationStyle = (animation?: PacingAnimation, delay?: number) => {
    if (!isVisible) {
      return { opacity: 0, transform: 'translateY(20px)' }
    }

    const baseStyle = {
      opacity: 1,
      transform: 'translateY(0)',
      transition: `all ${delay ? delay / 1000 : 0.5}s ease-out`
    }

    switch (animation) {
      case 'fade-in':
        return { ...baseStyle, transitionDelay: `${delay || 0}ms` }
      case 'slide-up':
        return { ...baseStyle, transitionDelay: `${delay || 0}ms` }
      case 'typewriter':
        // Typewriter effect would require character-by-character animation
        // For now, just fade in
        return { ...baseStyle, transitionDelay: `${delay || 0}ms` }
      default:
        return baseStyle
    }
  }

  return (
    <div
      ref={blockRef}
      data-block-id={block.id}
      className="relative group mb-6"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Block Actions (appear on hover) */}
      {isHovered && (
        <div className="absolute -left-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onComment && (
            <button
              onClick={onComment}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Add comment"
            >
              <MessageSquare size={16} />
            </button>
          )}
          {onShare && block.type === 'prose' && (
            <button
              onClick={() => onShare((block as ProseBlock).text)}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
              title="Share quote"
            >
              <Share2 size={16} />
            </button>
          )}
          {onEditSuggestion && block.type === 'prose' && (
            <button
              onClick={() => onEditSuggestion((block as ProseBlock).text)}
              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
              title="Suggest edit"
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>
      )}

      {/* Block Content */}
      <div style={block.type === 'prose' ? getAnimationStyle((block as ProseBlock).style?.animation, (block as ProseBlock).style?.delay) : undefined}>
        {block.type === 'prose' && (
          <ReadableProse
            block={block as ProseBlock}
            activeLanguage={activeLanguage}
            showDualLanguage={showDualLanguage}
            translations={translations?.[activeLanguage]?.[block.id]}
          />
        )}
        
        {block.type === 'heading' && (
          <ReadableHeading block={block as HeadingBlock} />
        )}
        
        {block.type === 'dialogue' && (
          <ReadableDialogue block={block as DialogueBlock} />
        )}
        
        {block.type === 'chat' && (
          <ReadableChat block={block as ChatBlock} />
        )}
        
        {block.type === 'phone' && (
          <ReadablePhone block={block as PhoneBlock} />
        )}
        
        {block.type === 'narration' && (
          <ReadableNarration block={block as NarrationBlock} />
        )}
        
        {block.type === 'divider' && (
          <div className="py-8">
            <hr className="border-gray-300" />
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// READABLE BLOCK RENDERERS
// ============================================================================

function ReadableProse({ 
  block, 
  activeLanguage, 
  showDualLanguage, 
  translations 
}: { 
  block: ProseBlock
  activeLanguage: string
  showDualLanguage: boolean
  translations?: any[]
}) {
  const proseRef = useRef<HTMLDivElement>(null)
  const [proseWidth, setProseWidth] = useState(760)

  useEffect(() => {
    const node = proseRef.current
    if (!node) return

    const update = () => {
      setProseWidth(node.clientWidth || 760)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  const proseMetrics = useMeasureTextHeight(
    block.text,
    '18px Georgia',
    Math.max(280, proseWidth),
    30,
    { whiteSpace: 'pre-wrap' }
  )

  // For now, just show the original text
  // In a full implementation, we'd split into sentences and show translations
  return (
    <div
      ref={proseRef}
      className="prose max-w-none"
      style={{ minHeight: `${Math.max(46, proseMetrics.height)}px` }}
      data-pretext-line-count={proseMetrics.lineCount}
    >
      <p style={{ textAlign: block.style?.textAlign }}>
        {block.text}
      </p>
      {showDualLanguage && translations && translations.length > 0 && (
        <p className="text-gray-600 italic mt-2 text-sm border-l-2 border-blue-300 pl-4">
          {translations[0]?.text || 'Translation not available'}
        </p>
      )}
    </div>
  )
}

function ReadableHeading({ block }: { block: HeadingBlock }) {
  const HeadingTag = `h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4'
  return <HeadingTag className="font-bold">{block.text}</HeadingTag>
}

function ReadableDialogue({ block }: { block: DialogueBlock }) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 my-6 space-y-3 font-mono text-sm">
      {block.lines.map((line, index) => (
        <div key={index} className="flex gap-3">
          <div className="font-bold uppercase min-w-[120px] text-right text-gray-700">
            {line.speaker}
            {line.emotion && <span className="text-gray-500 text-xs ml-2">({line.emotion})</span>}
          </div>
          <div className="flex-1 text-gray-900">{line.text}</div>
        </div>
      ))}
    </div>
  )
}

function ReadableChat({ block }: { block: ChatBlock }) {
  return (
    <div className="my-8">
      <ChatBlockEditor block={block} mode="preview" onUpdate={() => {}} />
    </div>
  )
}

function ReadablePhone({ block }: { block: PhoneBlock }) {
  return (
    <div className="my-8">
      <PhoneBlockEditor block={block} mode="preview" onUpdate={() => {}} />
    </div>
  )
}

function ReadableNarration({ block }: { block: NarrationBlock }) {
  return (
    <div className="my-8">
      <NarrationBlockEditor block={block} mode="preview" onUpdate={() => {}} />
    </div>
  )
}
