'use client'
/**
 * Custom TipTap Node extensions for Chapturs special block types.
 * Each block type becomes an atomic TipTap node with a React NodeView
 * that delegates to the existing BlockEditors components.
 */
import React from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { ReactNodeViewProps } from '@tiptap/react'
import { X } from 'lucide-react'
import { ChatBlockEditor, PhoneBlockEditor, DialogueBlockEditor, NarrationBlockEditor, ImageBlockEditor } from '../BlockEditors'
import type { ChatBlock, PhoneBlock, DialogueBlock, NarrationBlock, ImageBlock } from '@/types/chapt'

// ---------------------------------------------------------------------------
// Shared util: parse the data-block-data attribute from HTML
// ---------------------------------------------------------------------------

function parseBlockData(el: HTMLElement): unknown {
  const raw = el.getAttribute('data-block-data')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Shared block controls (delete button shown when node is selected)
// ---------------------------------------------------------------------------

function BlockControls({ onDelete }: { onDelete: () => void }) {
  return (
    <div className="absolute -top-3 -right-3 z-10">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md"
        title="Delete block"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helper: create a generic special-block node extension
// ---------------------------------------------------------------------------

function makeBlockExtension(
  name: string,
  dataType: string,
  NodeViewComponent: React.ComponentType<ReactNodeViewProps>
) {
  return Node.create({
    name,
    group: 'block',
    atom: true,
    draggable: true,
    selectable: true,

    addAttributes() {
      return {
        blockId: {
          default: '',
          parseHTML: (el) => el.getAttribute('data-block-id') || crypto.randomUUID(),
          renderHTML: (attrs) => ({ 'data-block-id': attrs.blockId }),
        },
        blockData: {
          default: null,
          parseHTML: (el) => parseBlockData(el as HTMLElement),
          renderHTML: (attrs) => ({
            'data-block-data': JSON.stringify(attrs.blockData),
          }),
        },
      }
    },

    parseHTML() {
      return [{ tag: `div[data-type="${dataType}"]` }]
    },

    renderHTML({ HTMLAttributes }) {
      return ['div', mergeAttributes({ 'data-type': dataType }, HTMLAttributes)]
    },

    addNodeView() {
      return ReactNodeViewRenderer(NodeViewComponent, {
        // Prevent bubbling of events from inside the React tree to ProseMirror
        stopEvent: () => true,
      })
    },
  })
}

// ---------------------------------------------------------------------------
// Chat Block
// ---------------------------------------------------------------------------

function ChatBlockNodeView({ node, updateAttributes, selected, deleteNode }: ReactNodeViewProps) {
  const blockData = (node.attrs.blockData || {
    id: node.attrs.blockId,
    type: 'chat',
    platform: 'generic',
    messages: [],
  }) as ChatBlock

  return (
    <NodeViewWrapper className={`relative my-4 ${selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}>
      <BlockControls onDelete={deleteNode} />
      <ChatBlockEditor
        block={blockData}
        mode="edit"
        onUpdate={(updates) =>
          updateAttributes({ blockData: { ...blockData, ...updates } })
        }
      />
    </NodeViewWrapper>
  )
}

export const ChatBlockExtension = makeBlockExtension('chatBlock', 'chat-block', ChatBlockNodeView)

// ---------------------------------------------------------------------------
// Phone Block
// ---------------------------------------------------------------------------

function PhoneBlockNodeView({ node, updateAttributes, selected, deleteNode }: ReactNodeViewProps) {
  const blockData = (node.attrs.blockData || {
    id: node.attrs.blockId,
    type: 'phone',
    phoneType: 'ios',
    content: [],
  }) as PhoneBlock

  return (
    <NodeViewWrapper className={`relative my-4 ${selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}>
      <BlockControls onDelete={deleteNode} />
      <PhoneBlockEditor
        block={blockData}
        mode="edit"
        onUpdate={(updates) =>
          updateAttributes({ blockData: { ...blockData, ...updates } })
        }
      />
    </NodeViewWrapper>
  )
}

export const PhoneBlockExtension = makeBlockExtension('phoneBlock', 'phone-block', PhoneBlockNodeView)

// ---------------------------------------------------------------------------
// Narration Block
// ---------------------------------------------------------------------------

function NarrationBlockNodeView({ node, updateAttributes, selected, deleteNode }: ReactNodeViewProps) {
  const blockData = (node.attrs.blockData || {
    id: node.attrs.blockId,
    type: 'narration',
    text: '',
    style: { variant: 'box', position: 'center' },
  }) as NarrationBlock

  return (
    <NodeViewWrapper className={`relative my-4 ${selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}>
      <BlockControls onDelete={deleteNode} />
      <NarrationBlockEditor
        block={blockData}
        mode="edit"
        onUpdate={(updates) =>
          updateAttributes({ blockData: { ...blockData, ...updates } })
        }
      />
    </NodeViewWrapper>
  )
}

export const NarrationBlockExtension = makeBlockExtension(
  'narrationBlock',
  'narration-block',
  NarrationBlockNodeView
)

// ---------------------------------------------------------------------------
// Dialogue Block
// ---------------------------------------------------------------------------

function DialogueBlockNodeView({ node, updateAttributes, selected, deleteNode }: ReactNodeViewProps) {
  const blockData = (node.attrs.blockData || {
    id: node.attrs.blockId,
    type: 'dialogue',
    lines: [],
  }) as DialogueBlock

  return (
    <NodeViewWrapper className={`relative my-4 ${selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}>
      <BlockControls onDelete={deleteNode} />
      <DialogueBlockEditor
        block={blockData}
        mode="edit"
        onUpdate={(updates) =>
          updateAttributes({ blockData: { ...blockData, ...updates } })
        }
      />
    </NodeViewWrapper>
  )
}

export const DialogueBlockExtension = makeBlockExtension(
  'dialogueBlock',
  'dialogue-block',
  DialogueBlockNodeView
)

// ---------------------------------------------------------------------------
// Image Block
// ---------------------------------------------------------------------------

function ImageBlockNodeView({ node, updateAttributes, selected, deleteNode }: ReactNodeViewProps) {
  const blockData = (node.attrs.blockData || {
    id: node.attrs.blockId,
    type: 'image',
    url: '',
  }) as ImageBlock

  return (
    <NodeViewWrapper className={`relative my-4 ${selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}>
      <BlockControls onDelete={deleteNode} />
      <ImageBlockEditor
        block={blockData}
        mode="edit"
        onUpdate={(updates) =>
          updateAttributes({ blockData: { ...blockData, ...updates } })
        }
      />
    </NodeViewWrapper>
  )
}

export const ImageBlockExtension = makeBlockExtension('imageBlock', 'image-block', ImageBlockNodeView)

// ---------------------------------------------------------------------------
// Promoted Story Block
// ---------------------------------------------------------------------------

import type { PromotedStoryBlock as PromotedStoryBlockType } from '@/types/chapt'

function PromotedStoryBlockNodeView({ node, updateAttributes, selected, deleteNode }: ReactNodeViewProps) {
  const blockData = (node.attrs.blockData || {
    id: node.attrs.blockId,
    type: 'promoted_story',
    workId: '',
    blurb: '',
  }) as PromotedStoryBlockType

  const [search, setSearch] = React.useState('')
  const [results, setResults] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (search.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}&limit=5`)
        const data = await res.json()
        setResults(data.works || data.results || [])
      } catch { setResults([]) }
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const hasSelection = blockData.workId

  return (
    <NodeViewWrapper className="relative my-4">
      <BlockControls onDelete={deleteNode} />
      <div className="border border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg p-4 bg-indigo-50/50 dark:bg-indigo-950/30">
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-3">
          📢 Promoted Story
        </p>

        {hasSelection ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded border">
              <div className="w-10 h-14 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">{blockData.workTitle || 'Selected story'}</p>
                <p className="text-xs text-gray-500">{blockData.authorName || ''}</p>
              </div>
              <button
                onClick={() => updateAttributes({ blockData: { ...blockData, workId: '', workTitle: '', authorName: '' } })}
                className="ml-auto text-xs text-gray-400 hover:text-red-500"
              >
                Change
              </button>
            </div>
            <textarea
              value={blockData.blurb}
              onChange={(e) => updateAttributes({ blockData: { ...blockData, blurb: e.target.value } })}
              placeholder="Why should your readers check this out?"
              className="w-full p-3 text-sm border rounded-lg bg-white dark:bg-gray-900 resize-none"
              rows={2}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for a story to promote..."
              className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-900"
              autoFocus
            />
            {loading && <p className="text-xs text-gray-400">Searching...</p>}
            {results.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {results.map((w: any) => (
                  <button
                    key={w.id}
                    onClick={() => updateAttributes({
                      blockData: {
                        ...blockData,
                        workId: w.id,
                        workTitle: w.title,
                        authorName: w.author?.user?.displayName || w.authorName || '',
                      }
                    })}
                    className="w-full text-left p-2 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{w.title}</p>
                    <p className="text-xs text-gray-500">{w.author?.user?.displayName || w.authorName || 'Unknown author'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const PromotedStoryBlockExtension = makeBlockExtension(
  'promotedStoryBlock',
  'promoted-story-block',
  PromotedStoryBlockNodeView
)
