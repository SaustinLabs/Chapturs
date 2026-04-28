'use client'

import { useState } from 'react'

export default function GutenbergImportForm() {
  const [url, setUrl] = useState('')
  const [maxChapters, setMaxChapters] = useState(150)
  const [dryRun, setDryRun] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setResult(null); setError(null)

    const res = await fetch('/api/admin/import/gutenberg', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url, options: { maxChapters, dryRun } }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Import failed'); return }
    setResult(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Gutenberg URL</label>
        <input
          type="url"
          required
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://www.gutenberg.org/ebooks/345"
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-4 items-center">
        <label className="text-sm">
          Max chapters:
          <input type="number" value={maxChapters} min={1} max={500}
            onChange={e => setMaxChapters(Number(e.target.value))}
            className="ml-2 border rounded px-2 py-1 w-20 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} />
          Dry run (preview only)
        </label>
      </div>
      <button type="submit" disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
        {loading ? 'Importing…' : 'Import'}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {result && (
        <pre className="bg-gray-50 border rounded p-3 text-xs overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </form>
  )
}
