'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { useToast } from '@/components/ui/Toast'
import {
  Cog6ToothIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface Setting {
  key: string
  value: string
  type: 'string' | 'boolean' | 'number' | 'text'
  label: string
  description?: string
  group: string
}

const GROUP_META: Record<string, { label: string; color: string }> = {
  general:      { label: 'General',        color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' },
  content:      { label: 'Content',        color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' },
  features:     { label: 'Features',       color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' },
  monetization: { label: 'Monetization',   color: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' },
  email:        { label: 'Email Addresses', color: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800' },
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<Setting[]>([])
  const [dirty, setDirty] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      } else {
        toast.error('Failed to load settings.')
      }
    } catch {
      toast.error('Failed to load settings.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const getValue = (s: Setting) => (s.key in dirty ? dirty[s.key] : s.value)

  const handleChange = (key: string, value: string) => {
    setDirty(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async (s: Setting) => {
    const value = getValue(s)
    setSaving(prev => ({ ...prev, [s.key]: true }))
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: s.key, value })
      })
      if (res.ok) {
        setSettings(prev => prev.map(x => x.key === s.key ? { ...x, value } : x))
        setDirty(prev => { const n = { ...prev }; delete n[s.key]; return n })
        toast.success(`"${s.label}" saved.`)
      } else {
        toast.error(`Failed to save "${s.label}".`)
      }
    } catch {
      toast.error('Network error while saving.')
    } finally {
      setSaving(prev => ({ ...prev, [s.key]: false }))
    }
  }

  const grouped = Object.keys(GROUP_META).reduce<Record<string, Setting[]>>((acc, g) => {
    acc[g] = settings.filter(s => s.group === g)
    return acc
  }, {})

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-8">
          <Cog6ToothIcon className="w-8 h-8 text-gray-500" />
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Site Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Runtime config — changes take effect immediately, no redeploy needed.
              For secrets (API keys, DB passwords) use{' '}
              <a href="https://github.com/SaustinLabs/Chapturs/settings/secrets/actions" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">GitHub Secrets</a>.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 dark:border-white" />
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(GROUP_META).map(([group, meta]) => {
              const groupSettings = grouped[group] || []
              if (groupSettings.length === 0) return null
              return (
                <section key={group} className={`rounded-2xl border p-6 ${meta.color}`}>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-5">{meta.label}</h2>
                  <div className="space-y-4">
                    {groupSettings.map(s => (
                      <SettingRow
                        key={s.key}
                        setting={s}
                        value={getValue(s)}
                        isDirty={s.key in dirty}
                        isSaving={!!saving[s.key]}
                        onChange={v => handleChange(s.key, v)}
                        onSave={() => handleSave(s)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function SettingRow({
  setting,
  value,
  isDirty,
  isSaving,
  onChange,
  onSave,
}: {
  setting: Setting
  value: string
  isDirty: boolean
  isSaving: boolean
  onChange: (v: string) => void
  onSave: () => void
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm">{setting.label}</p>
        {setting.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{setting.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {setting.type === 'boolean' ? (
          <button
            onClick={() => onChange(value === 'true' ? 'false' : 'true')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              value === 'true' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            role="switch"
            aria-checked={value === 'true'}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
              value === 'true' ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        ) : setting.type === 'text' ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={2}
            className="w-64 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="(empty — banner hidden)"
          />
        ) : setting.type === 'number' ? (
          <input
            type="number"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-28 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-64 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}

        {(isDirty || setting.type === 'boolean') && (
          <button
            onClick={onSave}
            disabled={isSaving || (!isDirty && setting.type === 'boolean')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isDirty
                ? 'bg-gray-900 text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-default'
            }`}
          >
            {isSaving ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircleIcon className="w-4 h-4" />
            )}
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>
    </div>
  )
}
