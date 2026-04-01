"use client"

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

type Rule = {
  id: string
  name: string
  type: string
  isActive: boolean
  config: string
  severity: string
}

export default function ValidationRulesAdmin() {
  const { toast } = useToast()
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<Rule>>({ isActive: true, severity: 'medium' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/validation-rules')
      const data = await res.json()
      if (data?.rules) setRules(data.rules)
      else toast.error('Failed to load validation rules.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to load validation rules.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      const res = await fetch('/api/admin/validation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data?.rule) {
        // Invalidate runtime cache so changes take effect immediately
        try {
          await fetch('/api/admin/validation-rules/invalidate', { method: 'POST' })
        } catch (e) {
          console.warn('Failed to call invalidate endpoint', e)
        }
        setForm({ isActive: true, severity: 'medium' })
        toast.success('Validation rule saved.')
        load()
      } else {
        toast.error('Failed to save rule.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to save rule.')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Validation Rules (Admin)</h1>

      <div className="mb-6">
        <h2 className="font-medium mb-2">Create / Update Rule</h2>
        <div className="space-y-2">
          <input placeholder="Name" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-2 border rounded" />
          <input placeholder="Type (safety|quality|plagiarism)" value={form.type || ''} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full p-2 border rounded" />
          <textarea placeholder='config (JSON)' value={form.config || ''} onChange={e => setForm({ ...form, config: e.target.value })} className="w-full p-2 border rounded" />
          <div className="flex items-center gap-2">
            <label className="flex items-center"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="mr-2" /> Active</label>
            <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} className="p-2 border rounded">
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </div>
          <div>
            <button onClick={save} className="px-3 py-2 bg-blue-600 text-white rounded">Save Rule</button>
          </div>
        </div>
      </div>
          <div className="mt-4">
            <button onClick={async () => {
              try {
                const r = await fetch('/api/admin/validation-rules/invalidate', { method: 'POST' })
                const d = await r.json()
                if (d?.success) toast.success('Validation rule cache invalidated.')
                else toast.error('Failed to invalidate cache.')
              } catch (e) { console.error(e); toast.error('Failed to invalidate cache.') }
            }} className="px-3 py-2 bg-gray-200 rounded">Invalidate Cache</button>
          </div>

      <div>
        <h2 className="font-medium mb-2">Existing Rules</h2>
        {loading ? <div>Loading...</div> : (
          <div className="space-y-2">
            {rules.map(r => (
              <div key={r.id} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">{r.name} <span className="text-sm text-gray-500">({r.type})</span></div>
                  <div className="text-sm text-gray-600">{r.config}</div>
                </div>
                <div className="text-sm text-gray-700">{r.isActive ? 'Active' : 'Disabled'} · {r.severity}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
