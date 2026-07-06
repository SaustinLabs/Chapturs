/**
 * Chapturs Content Format Types (.chapt)
 * 
 * This defines the core JSON structure for story chapters in Chapturs.
 * It supports flexible, block-based content that can be rendered in multiple ways.
 */

// ============================================================================
// CORE CONTENT TYPES
// ============================================================================

export type BlockType = 
  | 'prose'           // Traditional paragraph text
  | 'dialogue'        // Script-style dialogue with speaker labels
  | 'chat'            // Chat/messaging UI simulation
  | 'phone'           // Phone screen UI (SMS, messaging apps)
  | 'narration'       // Narrator box / system message
  | 'heading'         // Chapter/section headings
  | 'image'           // Embedded images
  | 'divider'         // Scene break / horizontal rule
  | 'choice'          // Interactive branching choice (future)
  | 'animation'       // Animation trigger (future)
  | 'promoted_story'  // Internal story promotion card

export type ChatPlatform = 
  | 'discord'
  | 'whatsapp'
  | 'sms'
  | 'telegram'
  | 'slack'
  | 'generic'

export type PacingAnimation = 
  | 'fade-in'
  | 'slide-up'
  | 'typewriter'
  | 'none'

// ============================================================================
// BLOCK DEFINITIONS
// ============================================================================

export interface BaseBlock {
  id: string
  type: BlockType
  align?: 'left' | 'center' | 'right' | 'full' // Horizontal alignment for the entire block
  metadata?: {
    created?: string
    modified?: string
    author?: string
  }
}

export interface ProseBlock extends BaseBlock {
  type: 'prose'
  text: string
  style?: {
    textAlign?: 'left' | 'center' | 'right' | 'justify'
    fontSize?: 'small' | 'normal' | 'large'
    fontWeight?: 'normal' | 'bold'
    animation?: PacingAnimation
    delay?: number // ms before block appears
  }
}

export interface DialogueBlock extends BaseBlock {
  type: 'dialogue'
  lines: Array<{
    speaker: string
    text: string
    emotion?: string // e.g., "angry", "sad", "happy"
  }>
}

export interface ChatMessage {
  id: string
  user: string
  text: string
  timestamp?: string
  avatar?: string
  status?: 'sent' | 'delivered' | 'read'
}

export interface ChatBlock extends BaseBlock {
  type: 'chat'
  platform: ChatPlatform
  messages: ChatMessage[]
  channelName?: string
  platformStyle?: {
    theme?: 'light' | 'dark'
    showTimestamps?: boolean
    showAvatars?: boolean
  }
}

export interface PhoneBlock extends BaseBlock {
  type: 'phone'
  phoneType?: 'ios' | 'android' | 'generic'
  content: ChatMessage[]
  phoneOwner?: string // The name of the phone owner (whose perspective we're seeing)
  ui?: {
    batteryLevel?: number
    signalStrength?: number
    time?: string
    carrier?: string
  }
}

export interface NarrationBlock extends BaseBlock {
  type: 'narration'
  text: string
  style?: {
    variant?: 'box' | 'overlay' | 'inline'
    position?: 'top' | 'center' | 'bottom'
  }
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading'
  text: string
  level: 1 | 2 | 3 | 4
}

export interface ImageBlock extends BaseBlock {
  type: 'image'
  url: string
  alt?: string
  caption?: string
  width?: number | string
  height?: number | string
}

export interface DividerBlock extends BaseBlock {
  type: 'divider'
  style?: 'line' | 'dots' | 'stars' | 'custom'
  customSymbol?: string
}

export interface PromotedStoryBlock extends BaseBlock {
  type: 'promoted_story'
  workId: string
  blurb: string
  workTitle?: string      // cached at insert time for preview
  authorName?: string     // cached at insert time for preview
}

// Union type of all block types
export type ContentBlock = 
  | ProseBlock
  | DialogueBlock
  | ChatBlock
  | PhoneBlock
  | NarrationBlock
  | HeadingBlock
  | ImageBlock
  | DividerBlock
  | PromotedStoryBlock

// ============================================================================
// TRANSLATION TYPES
// ============================================================================

export interface SentenceTranslation {
  id: string
  sentenceId: string // Reference to original sentence
  language: string   // ISO 639-1 code (e.g., "en", "ko", "ja")
  text: string
  translator?: {
    userId: string
    username: string
    rank?: number // Translation quality rank
  }
  version: number
  upvotes: number
  downvotes: number
  status: 'pending' | 'approved' | 'rejected' | 'canonical'
  createdAt: string
  updatedAt: string
}

export interface TranslationSuggestion {
  id: string
  sentenceId: string
  originalText: string
  suggestedText: string
  language: string
  userId: string
  reason?: string // Why this translation is better
  votes: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

// ============================================================================
// EDIT & COMMENT TYPES
// ============================================================================

export interface EditSuggestion {
  id: string
  blockId: string
  type: 'typo' | 'grammar' | 'style' | 'factual'
  originalText: string
  suggestedText: string
  userId: string
  username: string
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface BlockComment {
  id: string
  blockId: string
  userId: string
  username: string
  text: string
  replies?: BlockComment[]
  likes: number
  createdAt: string
  updatedAt: string
}

// ============================================================================
// CHAPTER DOCUMENT (.chapt)
// ============================================================================

export interface ChaptDocument {
  type: 'chapter'
  version: string // Document format version (e.g., "1.0.0")
  
  metadata: {
    id: string
    title: string
    chapterNumber?: number
    author: {
      id: string
      name: string
    }
    language: string // Primary/original language
    wordCount: number
    created: string
    modified: string
    status: 'draft' | 'published' | 'archived'
    tags?: string[]
  }
  
  content: ContentBlock[]
  
  // Optional fields for advanced features
  translations?: {
    [language: string]: {
      // Map block IDs to translated versions
      [blockId: string]: SentenceTranslation[]
    }
  }
  
  editSuggestions?: EditSuggestion[]
  comments?: BlockComment[]
  
  // Glossary entries introduced in this chapter
  glossary?: Array<{
    term: string
    definition: string
    firstAppearance: string // Block ID where term first appears
  }>
}

// ============================================================================
// EDITOR STATE
// ============================================================================

export interface EditorState {
  document: ChaptDocument
  currentBlockId: string | null
  selection: {
    blockId: string
    start: number
    end: number
  } | null
  mode: 'edit' | 'preview' | 'translate'
  language: string // Current viewing/editing language
  isDirty: boolean
  lastSaved: string | null
}

// ============================================================================
// API TYPES
// ============================================================================

export interface SaveChapterRequest {
  workId: string
  chapterId?: string
  document: ChaptDocument
}

export interface TranslationRequest {
  chapterId: string
  language: string
  blockId: string
  sentenceId: string
  translation: string
}

export interface EditSuggestionRequest {
  chapterId: string
  blockId: string
  type: EditSuggestion['type']
  originalText: string
  suggestedText: string
  reason?: string
}

export interface CommentRequest {
  chapterId: string
  blockId: string
  text: string
  replyTo?: string // Parent comment ID
}
