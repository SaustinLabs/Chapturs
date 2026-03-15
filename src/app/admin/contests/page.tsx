'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, TrophyIcon, UsersIcon } from '@heroicons/react/24/outline'

interface Contest {
  id: string
  title: string
  status: string
  startDate: string
  endDate: string
  prizePool: number
  _count: { entries: number }
}

export default function AdminContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rules: '',
    startDate: '',
    endDate: '',
    submissionDeadline: '',
    prizePool: 0,
    prizeSplit: '[{"place": 1, "percent": 100}]',
    adRevenueShare: 10
  })

  const fetchContests = async () => {
    try {
      const res = await fetch('/api/admin/contests')
      if (res.ok) {
        const data = await res.json()
        setContests(data.data.contests)
      }
    } catch (e) {
      console.error('Failed to load contests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContests()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowCreateModal(false)
        fetchContests()
      }
    } catch (e) {
      console.error('Failed to create contest')
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/contests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) fetchContests()
    } catch (e) {
      console.error('Update failed')
    }
  }

  const deleteContest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contest?')) return
    try {
      const res = await fetch(`/api/admin/contests/${id}`, { method: 'DELETE' })
      if (res.ok) fetchContests()
    } catch (e) {
      console.error('Delete failed')
    }
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contest Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Create and oversee platform-wide writing competitions.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Contest</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center h-64 items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {contests.map(contest => (
              <div key={contest.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{contest.title}</h3>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        contest.status === 'active' ? 'bg-green-100 text-green-800' :
                        contest.status === 'voting' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {contest.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <UsersIcon className="w-4 h-4" />
                        <span>{contest._count.entries} Entries</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrophyIcon className="w-4 h-4" />
                        <span>${contest.prizePool} Prize</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Ends {new Date(contest.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {contest.status === 'draft' && (
                      <button onClick={() => updateStatus(contest.id, 'active')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Publish">
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteContest(contest.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Simplified Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 dark:text-white">Create New Contest</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Contest Title"
                  required
                  className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:text-white"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
                <textarea
                  placeholder="Description"
                  required
                  rows={4}
                  className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:text-white"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase px-1 mb-1">Start Date</label>
                    <input type="date" required className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:text-white" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase px-1 mb-1">End Date</label>
                    <input type="date" required className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:text-white" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase px-1 mb-1">Submission Deadline</label>
                    <input type="date" required className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:text-white" value={formData.submissionDeadline} onChange={e => setFormData({...formData, submissionDeadline: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase px-1 mb-1">Initial Prize Pool ($)</label>
                    <input type="number" required className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:text-white" value={formData.prizePool} onChange={e => setFormData({...formData, prizePool: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-8">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2 text-gray-600 font-medium">Cancel</button>
                  <button type="submit" className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Create Contest</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
