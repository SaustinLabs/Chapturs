'use client'

import { useEffect, useMemo, useState } from 'react'
import { resolveCoverSrc } from '@/lib/images'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface WorkCardConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
  availableWorks: Array<{
    id: string
    title: string
    coverImage?: string
    status: string
    genres: string[]
  }>
}

/**
 * WorkCardConfig - v0.1.5
 * Configuration modal for WorkCardBlock
 * Allows selecting a work from the creator's portfolio
 */
export default function WorkCardConfig({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableWorks
}: WorkCardConfigProps) {
  const { toast } = useToast()
  const [selectedWorkId, setSelectedWorkId] = useState(initialData?.workId || '')
  const [customText, setCustomText] = useState(initialData?.customText || '')

  const selectedWork = availableWorks.find(w => w.id === selectedWorkId)

  const handleSave = () => {
    if (!selectedWorkId) {
      toast.warning('Please select a work')
      return
    }

    onSave({
      workId: selectedWorkId,
      customText: customText.trim()
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Work Card" size="md">
      <div className="space-y-4">
        {/* Work Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Work
          </label>
          <select
            value={selectedWorkId}
            onChange={(e) => setSelectedWorkId(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Choose a work...</option>
            {availableWorks.map(work => (
              <option key={work.id} value={work.id}>
                {work.title}{work.status ? ` (${work.status})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {selectedWork && (
          <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Preview</p>
            <div className="flex items-start gap-3">
              {selectedWork.coverImage && (
                <img
                  src={resolveCoverSrc(selectedWork.id, selectedWork.coverImage)}
                  alt={selectedWork.title}
                  className="w-16 h-20 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-100 text-sm mb-1">
                  {selectedWork.title}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {(selectedWork.genres || []).slice(0, 2).map(genre => (
                    <span 
                      key={genre}
                      className="px-2 py-0.5 bg-blue-900/30 text-blue-300 text-xs rounded"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Text (for expanded view) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Custom Text (optional)
            <span className="text-xs text-gray-500 ml-2">
              Shown when block is expanded
            </span>
          </label>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Add a note about this work..."
          />
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
