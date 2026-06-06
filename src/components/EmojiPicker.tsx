'use client'

import { useState, useEffect, useRef } from 'react'
import EmojiPickerReact, { Theme, EmojiClickData } from 'emoji-picker-react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { getRecentEmojis, addRecentEmoji } from '@/lib/emoji/emojiData'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose?: () => void
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  theme?: 'light' | 'dark' | 'auto'
}

export default function EmojiPicker({
  onSelect,
  onClose,
  position = 'bottom-left',
  theme = 'auto'
}: EmojiPickerProps) {
  const [mounted, setMounted] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<Theme>(Theme.AUTO)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Handle mounting on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Set theme based on prop or system preference
  useEffect(() => {
    if (theme === 'auto') {
      setCurrentTheme(Theme.AUTO)
    } else if (theme === 'dark') {
      setCurrentTheme(Theme.DARK)
    } else {
      setCurrentTheme(Theme.LIGHT)
    }
  }, [theme])

  // Close on click outside
  useEffect(() => {
    if (!onClose) return

    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Handle emoji selection
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji
    addRecentEmoji(emoji)
    onSelect(emoji)
  }

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'top-full right-0 mt-2'
      case 'top-left':
        return 'bottom-full left-0 mb-2'
      case 'top-right':
        return 'bottom-full right-0 mb-2'
      case 'bottom-left':
      default:
        return 'top-full left-0 mt-2'
    }
  }

  if (!mounted) return null

  return (
    <div
      ref={pickerRef}
      className={`absolute ${getPositionClasses()} z-50 shadow-2xl rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600`}
    >
      {onClose && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Close emoji picker"
          >
            <XMarkIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      )}
      
      <EmojiPickerReact
        onEmojiClick={handleEmojiClick}
        theme={currentTheme}
        searchPlaceHolder="Search emojis..."
        previewConfig={{
          showPreview: false
        }}
        width={350}
        height={400}
      />
    </div>
  )
}
