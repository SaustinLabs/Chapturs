'use client'
/**
 * Custom TipTap Node extensions for Chapturs special block types.
 * Each block type becomes an atomic TipTap node with a React NodeView
 * that delegates to the existing BlockEditors components.
 */
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
