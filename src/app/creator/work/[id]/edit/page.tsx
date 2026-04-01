'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { useUser } from '@/hooks/useUser'
import ImageUpload from '@/components/upload/ImageUpload'
import { useToast } from '@/components/ui/Toast'

export default function EditWorkPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const workId = params?.id as string
  const { userId, isAuthenticated, isLoading: userLoading } = useUser()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [work, setWork] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genres: [] as string[],
    tags: [] as string[],
    maturityRating: 'PG',
    status: 'draft',
    coverImage: ''
  })

  useEffect(() => {
    if (!isAuthenticated || !userId) return
    
    const fetchWork = async () => {
      try {
        const response = await fetch(`/api/works/${workId}`)
        if (response.ok) {
          const data = await response.json()
          setWork(data)
          setFormData({
            title: data.title || '',
            description: data.description || '',
            genres: data.genres || [],
            tags: data.tags || [],
            maturityRating: data.maturityRating || 'PG',
            status: data.status || 'draft',
            coverImage: data.coverImage || ''
          })
        }
      } catch (error) {
        console.error('Failed to fetch work:', error)
        toast.error('Failed to load work details.')
      } finally {
        setLoading(false)
      }
    }

    fetchWork()
  }, [workId, isAuthenticated, userId])

  const handleSave = async () => {
    try {
      setSaving(true)
      console.log('Saving work with formData:', formData)
      const response = await fetch(`/api/works/${workId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Save successful:', result)
        toast.success('Work updated successfully.')
        router.push('/creator/works')
      } else {
        const error = await response.json()
        console.error('Save failed:', error)
        toast.error(`Failed to update work: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving work:', error)
      toast.error('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  if (userLoading || loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!work) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Work Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The work you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/creator/works')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Manage Stories
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Edit Work
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your work's metadata and settings
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cover Image
            </label>
            <ImageUpload
              entityType="cover"
              entityId={workId}
              currentImage={formData.coverImage}
              onUploadComplete={(image) => {
                 console.log('[Edit Page] Image upload complete:', image)
                 console.log('[Edit Page] Setting coverImage to:', image.urls.optimized)
                 setFormData((prev) => {
                   const updated = { ...prev, coverImage: image.urls.optimized }
                   console.log('[Edit Page] Updated formData:', updated)
                   return updated
                 })
              }}
              onUploadError={(error) => {
                console.error('Cover upload error:', error)
                toast.error(`Failed to upload cover: ${error}`)
              }}
              label="Book Cover"
              hint="Recommended: 640×1024px (portrait) or similar book cover ratio"
            />
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Genres
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Current: {formData.genres.join(', ') || 'None'}
            </p>
            <input
              type="text"
              placeholder="Enter genres separated by commas"
              onBlur={(e) => {
                const value = e.target.value
                if (value) {
                  setFormData({ ...formData, genres: value.split(',').map(g => g.trim()) })
                  e.target.value = ''
                }
              }}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Current: {formData.tags.join(', ') || 'None'}
            </p>
            <input
              type="text"
              placeholder="Enter tags separated by commas"
              onBlur={(e) => {
                const value = e.target.value
                if (value) {
                  setFormData({ ...formData, tags: value.split(',').map(t => t.trim()) })
                  e.target.value = ''
                }
              }}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Maturity Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maturity Rating
            </label>
            <select
              value={formData.maturityRating}
              onChange={(e) => setFormData({ ...formData, maturityRating: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="G">G - General Audiences</option>
              <option value="PG">PG - Parental Guidance</option>
              <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
              <option value="R">R - Restricted</option>
              <option value="NC-17">NC-17 - Adults Only</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">Hiatus</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => router.push(`/creator/work/${workId}/chapters`)}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Manage Chapters
            </button>
            <button
              onClick={() => router.push(`/creator/works/${workId}/collaborators`)}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Collaborators
            </button>
            <button
              onClick={() => router.push('/creator/works')}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
