'use client'

import { useState } from 'react'

interface LivingWorld {
  id: string
  title: string
  description?: string | null
  theBeginning?: string | null
  theEnd?: string | null
  coverImage?: string | null
  status: string
}

interface Props {
  world: LivingWorld
  onSave: (updates: Partial<LivingWorld>) => Promise<void>
  canEdit: boolean
  canArchive: boolean
}

export default function WorldDefinitionForm({ world, onSave, canEdit, canArchive }: Props) {
  const [form, setForm] = useState({
    title: world.title,
    description: world.description ?? '',
    theBeginning: world.theBeginning ?? '',
    theEnd: world.theEnd ?? '',
    coverImage: world.coverImage ?? '',
  })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    await onSave({
      title: form.title || undefined,
      description: form.description || undefined,
      theBeginning: form.theBeginning || undefined,
      theEnd: form.theEnd || undefined,
      coverImage: form.coverImage || undefined,
    })
    setSaving(false)
    setDirty(false)
  }

  async function handleArchive() {
    if (!confirm('Archive this world? It will no longer appear in the public feed.')) return
    setSaving(true)
    await onSave({ status: 'archived' })
    setSaving(false)
  }

  return (
    <div className="space-y-8">
      {/* Cover + title */}
      <div className="flex gap-6 items-start">
        <div className="w-24 h-32 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
          {form.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.coverImage} alt="World cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs text-center p-2">
              No cover
            </div>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">World Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>
          {canEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Cover Image URL</label>
              <input
                type="url"
                value={form.coverImage}
                onChange={(e) => update('coverImage', e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          <p className="text-xs text-gray-500">
            Status: <span className="capitalize text-gray-300">{world.status}</span>
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          disabled={!canEdit}
          rows={3}
          placeholder="A shared universe where…"
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 resize-none"
        />
      </div>

      {/* The Beginning */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          The Beginning
          <span className="ml-2 text-xs font-normal text-gray-500">Canon origin event — the moment this universe was created</span>
        </label>
        <textarea
          value={form.theBeginning}
          onChange={(e) => update('theBeginning', e.target.value)}
          disabled={!canEdit}
          rows={4}
          placeholder="In the year 3042, the Fold collapsed…"
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 resize-none"
        />
      </div>

      {/* The End */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          The End
          <span className="ml-2 text-xs font-normal text-gray-500">Optional — canonical destiny for this universe</span>
        </label>
        <textarea
          value={form.theEnd}
          onChange={(e) => update('theEnd', e.target.value)}
          disabled={!canEdit}
          rows={4}
          placeholder="The universe collapses back into the Fold when…"
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 resize-none"
        />
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {dirty && (
              <button
                onClick={() => {
                  setForm({
                    title: world.title,
                    description: world.description ?? '',
                    theBeginning: world.theBeginning ?? '',
                    theEnd: world.theEnd ?? '',
                    coverImage: world.coverImage ?? '',
                  })
                  setDirty(false)
                }}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:text-gray-100 transition-colors"
              >
                Discard
              </button>
            )}
          </div>
          {canArchive && world.status === 'active' && (
            <button
              onClick={handleArchive}
              disabled={saving}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Archive world
            </button>
          )}
        </div>
      )}
    </div>
  )
}
