'use client'

import {
  MinusIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

type ReaderTheme = 'auto' | 'paper' | 'night'

export interface ReaderSettings {
  fontSize: 'small' | 'medium' | 'large' | 'xl'
  fontFamily: string
  lineHeight: number
  theme: ReaderTheme
  brightness: number
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 'medium',
  fontFamily: 'Inter',
  lineHeight: 1.7,
  theme: 'auto',
  brightness: 100,
}

const FONT_FAMILY_OPTIONS = ['Inter', 'Merriweather', 'Georgia', 'system-ui']

interface ChapterReaderSettingsProps {
  settings: ReaderSettings
  onChange: (settings: ReaderSettings) => void
  onClose: () => void
}

export default function ChapterReaderSettings({
  settings,
  onChange,
  onClose,
}: ChapterReaderSettingsProps) {
  const update = (patch: Partial<ReaderSettings>) => {
    onChange({ ...settings, ...patch })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 h-full overflow-y-auto shadow-xl border-l border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Display Settings</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Font Size */}
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const opts = ['small', 'medium', 'large', 'xl'] as const
                  const idx = opts.indexOf(settings.fontSize)
                  if (idx > 0) update({ fontSize: opts[idx - 1] })
                }}
                className="p-2 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <span className="flex-1 text-center text-sm text-gray-600 dark:text-gray-400 capitalize">
                {settings.fontSize}
              </span>
              <button
                onClick={() => {
                  const opts = ['small', 'medium', 'large', 'xl'] as const
                  const idx = opts.indexOf(settings.fontSize)
                  if (idx < opts.length - 1) update({ fontSize: opts[idx + 1] })
                }}
                className="p-2 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Font Family */}
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font</label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_FAMILY_OPTIONS.map((font) => (
                <button
                  key={font}
                  onClick={() => update({ fontFamily: font })}
                  className={`px-3 py-2 rounded border text-sm text-left ${
                    settings.fontFamily === font
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          </section>

          {/* Line Height */}
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Line Height: {settings.lineHeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="1.35"
              max="2.15"
              step="0.05"
              value={settings.lineHeight}
              onChange={(e) => update({ lineHeight: parseFloat(e.target.value) })}
              className="w-full"
            />
          </section>

          {/* Theme */}
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'auto', label: 'Auto', desc: 'System' },
                { value: 'paper', label: 'Paper', desc: 'Warm' },
                { value: 'night', label: 'Night', desc: 'Dark' },
              ] as const).map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => update({ theme: value })}
                  className={`px-3 py-2 rounded border text-center ${
                    settings.theme === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-[10px] opacity-60">{desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Brightness */}
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Brightness
            </label>
            <input
              type="range"
              min="60"
              max="120"
              value={settings.brightness}
              onChange={(e) => update({ brightness: parseInt(e.target.value) })}
              className="w-full"
            />
          </section>

          {/* Reset */}
          <button
            onClick={() => onChange(DEFAULT_READER_SETTINGS)}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-600 rounded"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  )
}
