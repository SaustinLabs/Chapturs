import { Edit3, Globe, MessageSquare, Sparkles, UserPlus } from 'lucide-react'
import { SelectionAction } from '@/components/SelectionActionToolbar'

export type SelectionRole = 'reader' | 'author' | 'moderator'

interface ReaderSelectionOptions {
  role: SelectionRole
  enableCollaboration: boolean
  enableTranslation: boolean
  /** Phase 2: true when the reader is viewing a translated version of the work */
  isViewingTranslation?: boolean
  onComment: () => void
  onSuggestEdit: () => void
  onSuggestTranslation: () => void
  onFanArt: () => void
}

interface EditorSelectionOptions {
  onAddGlossary: () => void
  onAddCharacter: () => void
}

export function buildReaderSelectionActions({
  role,
  enableCollaboration,
  enableTranslation,
  isViewingTranslation = false,
  onComment,
  onSuggestEdit,
  onSuggestTranslation,
  onFanArt
}: ReaderSelectionOptions): SelectionAction[] {
  if (!enableCollaboration || role === 'author') return []

  return [
    {
      id: 'comment',
      label: 'Comment',
      icon: <MessageSquare size={14} />,
      onClick: onComment,
      variant: 'primary'
    },
    {
      id: 'suggest',
      label: isViewingTranslation ? 'Suggest Edit (Original)' : 'Suggest Edit',
      icon: <Edit3 size={14} />,
      onClick: onSuggestEdit
    },
    ...(enableTranslation
      ? [
          {
            id: 'suggest-translation',
            label: 'Suggest Translation',
            icon: <Globe size={14} />,
            onClick: onSuggestTranslation,
            // Phase 2: make this the visually primary action when viewing a translation
            variant: isViewingTranslation ? ('primary' as const) : undefined
          }
        ]
      : []),
    ...(role === 'reader'
      ? [
          {
            id: 'fan-art',
            label: 'Fan Art',
            icon: <Sparkles size={14} />,
            onClick: onFanArt
          }
        ]
      : [])
  ]
}

export function buildEditorSelectionActions({
  onAddGlossary,
  onAddCharacter
}: EditorSelectionOptions): SelectionAction[] {
  return [
    {
      id: 'glossary',
      label: 'Glossary',
      icon: <Sparkles size={14} />,
      onClick: onAddGlossary,
      variant: 'primary'
    },
    {
      id: 'character',
      label: 'Character',
      icon: <UserPlus size={14} />,
      onClick: onAddCharacter
    }
  ]
}