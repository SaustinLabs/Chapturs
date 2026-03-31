import { Edit3, Globe, MessageSquare, Sparkles, UserPlus } from 'lucide-react'
import { SelectionAction } from '@/components/SelectionActionToolbar'

interface ReaderSelectionOptions {
  enableCollaboration: boolean
  enableTranslation: boolean
  onComment: () => void
  onSuggestEdit: () => void
  onTranslate: () => void
}

interface EditorSelectionOptions {
  onAddGlossary: () => void
  onAddCharacter: () => void
}

export function buildReaderSelectionActions({
  enableCollaboration,
  enableTranslation,
  onComment,
  onSuggestEdit,
  onTranslate
}: ReaderSelectionOptions): SelectionAction[] {
  if (!enableCollaboration) return []

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
      label: 'Suggest Edit',
      icon: <Edit3 size={14} />,
      onClick: onSuggestEdit
    },
    ...(enableTranslation
      ? [
          {
            id: 'translate',
            label: 'Translate',
            icon: <Globe size={14} />,
            onClick: onTranslate
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