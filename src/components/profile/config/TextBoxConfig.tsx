'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface TextBoxConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

/**
 * TextBoxConfig - v0.1.5
 * Configuration modal for TextBoxBlock
 * Allows editing markdown content and styling
 */
export default function TextBoxConfig({
  isOpen,
  onClose,
  onSave,
  initialData
}: TextBoxConfigProps) {
  const { toast } = useToast()
  const [content, setContent] = useState(initialData?.content || '')
  const [alignment, setAlignment] = useState(initialData?.alignment || 'left')
  const [fontSize, setFontSize] = useState(initialData?.fontSize || 'normal')

  const handleSave = () => {
    if (!content.trim()) {
      toast.warning('Please enter some content')
      return
    }

    onSave({
      content: content.trim(),
      alignment,
      fontSize
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Text Box" size="lg">
      <div className="space-y-4">
        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Content (Markdown Supported)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none font-mono text-sm"
            rows={8}
            placeholder="Enter your text here... You can use **bold**, *italic*, [links](url), etc."
          />
          <p className="text-xs text-gray-500 mt-1">
            Supports Markdown: **bold**, *italic*, [links](url), lists, etc.
          </p>
        </div>

        {/* Styling Options */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Text Alignment
            </label>
            <select
              value={alignment}
              onChange={(e) => setAlignment(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Font Size
            </label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="small">Small</option>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preview
          </label>
          <div 
            className={`
              p-4 bg-gray-900 border border-gray-700 rounded-lg
              ${alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left'}
              ${fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'}
            `}
          >
            {content ? (
              <div className="prose prose-invert prose-sm max-w-none">
                {content.split('\n').map((line: string, i: number) => (
                  <p key={i} className="text-gray-300">{line}</p>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">Your text will appear here...</p>
            )}
          </div>
        </div>

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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
