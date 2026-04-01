'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, MessageSquare, FileText, CheckCircle, Trash2, XCircle } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function ModeratorDashboard() {
  const { toast } = useToast()
  const [commentReports, setCommentReports] = useState<any[]>([])
  const [contentReports, setContentReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports')
      if (res.ok) {
        const data = await res.json()
        setCommentReports(data.commentReports || [])
        setContentReports(data.contentReports || [])
      } else {
        toast.error('Failed to load moderation reports.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load moderation reports.')
    } finally {
      setLoading(false)
    }
  }

  const handleCommentAction = async (id: string, action: 'dismiss' | 'delete') => {
    try {
      const res = await fetch(`/api/admin/reports/comment/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        toast.success(action === 'dismiss' ? 'Comment report dismissed.' : 'Comment deleted.')
        fetchReports()
      } else {
        toast.error('Failed to apply comment action.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to apply comment action.')
    }
  }

  const handleContentAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/reports/content/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        toast.success(action === 'approve' ? 'Content report dismissed.' : 'Content rejected.')
        fetchReports()
      } else {
        toast.error('Failed to apply content action.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to apply content action.')
    }
  }

  if (loading) {
    return <div className="p-8 mt-16 text-center text-gray-500">Loading moderation queue...</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 mt-16">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-red-500" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Moderator Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Comment Reports */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Reported Comments</h2>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full ml-auto">
              {commentReports.length} pending
            </span>
          </div>

          <div className="space-y-4">
            {commentReports.length === 0 ? (
              <p className="text-gray-500 text-sm">No pending comment reports.</p>
            ) : (
              commentReports.map((report) => (
                <div key={report.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">{report.reason}</span>
                    <span className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Comment Context</p>
                  <blockquote className="text-sm italic text-gray-600 dark:text-gray-400 border-l-2 border-gray-300 pl-3 mb-3">
                    "{report.comment?.content}"
                  </blockquote>
                  <p className="text-xs text-gray-500 mb-4">Report Details: {report.details || 'None'}</p>
                  
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => handleCommentAction(report.id, 'dismiss')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Dismiss Report
                    </button>
                    <button 
                      onClick={() => handleCommentAction(report.id, 'delete')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Comment
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Content Reports */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Reported Content</h2>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full ml-auto">
              {contentReports.length} pending
            </span>
          </div>

          <div className="space-y-4">
            {contentReports.length === 0 ? (
              <p className="text-gray-500 text-sm">No pending content reports.</p>
            ) : (
              contentReports.map((report) => (
                <div key={report.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Priority: {report.priority}</span>
                    <span className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Work: {report.work?.title || 'Unknown Work'} 
                      {report.section && <span className="text-gray-500 text-xs ml-2">(Chapter: {report.section.title})</span>}
                    </p>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                    <span className="font-semibold block mb-1">Reason:</span>
                    {report.reason}
                  </p>
                  
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => handleContentAction(report.id, 'approve')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Looks Good (Dismiss)
                    </button>
                    <button 
                      onClick={() => handleContentAction(report.id, 'reject')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                      Take Down Content
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
