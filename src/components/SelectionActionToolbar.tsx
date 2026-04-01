'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'

export interface SelectionAction {
  id: string
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  className?: string
}

interface SelectionActionToolbarProps {
  visible: boolean
  position: { top: number; left: number }
  actions: SelectionAction[]
  onClose: () => void
  className?: string
}

export default function SelectionActionToolbar({
  visible,
  position,
  actions,
  onClose,
  className
}: SelectionActionToolbarProps) {
  if (!visible || actions.length === 0) return null

  return (
    <div
      className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-2 ${className || ''}`}
      style={{ top: position.top, left: position.left }}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          onMouseDown={(event) => {
            // Keep the current text selection active while clicking toolbar actions.
            event.preventDefault()
          }}
          onClick={action.onClick}
          disabled={action.disabled}
          className={
            action.variant === 'primary'
              ? `px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${action.className || ''}`
              : `px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${action.className || ''}`
          }
        >
          {action.icon}
          {action.label}
        </button>
      ))}

      <button
        onMouseDown={(event) => {
          event.preventDefault()
        }}
        onClick={onClose}
        className="p-1.5 text-gray-400 hover:text-gray-600"
      >
        <X size={14} />
      </button>
    </div>
  )
}