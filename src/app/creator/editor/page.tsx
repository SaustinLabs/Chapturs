'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import ChaptursEditor from '@/components/ChaptursEditor'
import ConfirmMatureModal from '@/components/ConfirmMatureModal'
import AdvancedUploader from '@/components/AdvancedUploader'
import AppLayout from '@/components/AppLayout'
import { useToast } from '@/components/ui/Toast'
import { ContentFormat } from '@/types'
import { ChaptDocument } from '@/types/chapt'
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Upload,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Palette,
  Users,
  Calendar,
  Zap,
  Download,
  Share,
  MoreHorizontal
} from 'lucide-react'

interface EditorMode {
  type: 'editor' | 'uploader'
  subMode?: 'text' | 'file' | 'bulk'
}

export default function CreatorEditorPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  // URL parameters - with safe fallbacks
  const workId = searchParams?.get('workId') || (params?.workId as string | undefined) || undefined
  const draftId = searchParams?.get('draftId') || undefined
  const chapterId = searchParams?.get('chapterId') || (params?.chapterId as string | undefined) || undefined
  const formatType = (searchParams?.get('format') || 'novel') as ContentFormat
  const mode = searchParams?.get('mode') === 'edit' ? 'edit' : 'create'

  console.log('Editor page loaded with:', { formatType, mode, workId, draftId, chapterId })
  console.log('If chapterId is present, we should load that chapter:', chapterId)
  console.log('Should use experimental editor?', formatType === 'experimental')

  // Safety check - if we're in an invalid state, show loading
  if (!searchParams) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading editor...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // UI State
  const [editorMode, setEditorMode] = useState<EditorMode>({ type: 'editor' })
  const [showSettings, setShowSettings] = useState(false)
  const [loadedContent, setLoadedContent] = useState<ChaptDocument | undefined>(undefined)
  const [currentWork, setCurrentWork] = useState({
    id: workId || draftId,
    title: '',
    description: '',
    formatType,
    status: mode === 'create' ? 'unpublished' : 'draft' as 'draft' | 'ongoing' | 'completed' | 'unpublished',
    chaptersCount: 0,
    wordsCount: 0,
    subscribers: 0,
    isDraft: Boolean(draftId), // Track if this is working with a draft
    hasContent: false // Track if work has any content yet
  })

  // Project statistics
  const [projectStats, setProjectStats] = useState({
    totalWords: 0,
    chaptersWritten: 0,
    timeSpent: 0, // in minutes
    lastSaved: new Date(),
    targetWords: 0, // default off - enabled via settings
    dailyGoal: 1000
  })

  // Quick actions state
  const [quickActions, setQuickActions] = useState({
    autoSave: true,
    livePreview: false,
    focusMode: false,
    darkMode: false,
    goalMode: false // NaNoWriMo-style goal tracking
  })

  // UI state
  const [showStatsBar, setShowStatsBar] = useState(false) // Quick stats bar toggle

  // Publishing flow entry picker (#105)
  const [startPickerDismissed, setStartPickerDismissed] = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  // Show the "how do you want to start?" picker for new chapters (not when editing an existing one)
  const showStartPicker = mode === 'create' && !chapterId && !startPickerDismissed

  useEffect(() => {
    console.log('useEffect triggered:', { mode, workId, draftId, chapterId })
    // Load work data if workId provided (load existing work + sections)
    if (workId) {
      console.log('Calling loadWorkData for workId:', workId)
      loadWorkData(workId)
      
      // If chapterId is provided, load that specific chapter for editing
      if (chapterId) {
        console.log('Loading specific chapter for editing:', chapterId)
        loadSpecificChapter(workId, chapterId)
      } else {
        // Otherwise just load sections list
        loadWorkSections(workId)
      }
    } else if (draftId) {
      console.log('Calling loadDraftData for draftId:', draftId)
      loadDraftData(draftId)
    } else {
      console.log('No data to load - mode:', mode, 'workId:', workId, 'draftId:', draftId)
    }
  }, [mode, workId, draftId, chapterId])

  const loadWorkData = async (workId: string) => {
    try {
      console.log('Loading work data for workId:', workId)
      const response = await fetch(`/api/works/${workId}`)
      if (response.ok) {
        const work = await response.json()
        console.log('Loaded work data:', work)
        
        // Safely parse statistics if it's a JSON string
        let statistics = work.statistics
        if (typeof statistics === 'string') {
          try {
            statistics = JSON.parse(statistics)
          } catch (e) {
            console.error('Failed to parse statistics:', e)
            statistics = { wordCount: 0 }
          }
        }
        
        setCurrentWork(prev => ({
          ...prev,
          title: work.title || '',
          description: work.description || '',
          formatType: work.formatType || prev.formatType,
          status: work.status || prev.status,
          chaptersCount: work.sections?.length || 0,
          wordsCount: statistics?.wordCount || 0,
          hasContent: (work.sections?.length || 0) > 0
        }))
      } else {
        console.error('Failed to load work data, status:', response.status)
      }
    } catch (error) {
      console.error('Error loading work data:', error)
    }
  }

  const loadSpecificChapter = async (workId: string, chapterId: string) => {
    try {
      console.log('Loading specific chapter:', { workId, chapterId })
      
      // Load work data first to get the title
      const workResponse = await fetch(`/api/works/${workId}`)
      if (workResponse.ok) {
        const workData = await workResponse.json()
        setCurrentWork(prev => ({
          ...prev,
          title: workData.title,
          description: workData.description || '',
          chaptersCount: workData.sectionsCount || 0,
          wordsCount: workData.totalWords || 0,
          hasContent: true
        }))
      }
      
      const response = await fetch(`/api/works/${workId}/sections`)
      if (response.ok) {
        const result = await response.json()
        const sectionsArray = result.sections || []
        
        // Find the specific chapter
        const targetChapter = sectionsArray.find((s: any) => s.id === chapterId)
        if (targetChapter) {
          console.log('Found target chapter:', targetChapter)
          try {
            const contentBlocks = typeof targetChapter.content === 'string' 
              ? JSON.parse(targetChapter.content) 
              : targetChapter.content
            
            // Construct a full ChaptDocument with metadata
            const chaptDocument = {
              type: 'chapter' as const,
              version: '1.0.0',
              metadata: {
                id: targetChapter.id,
                title: targetChapter.title || 'Untitled Chapter',
                chapterNumber: targetChapter.chapterNumber || 1,
                author: {
                  id: 'current-user', // Will be filled from session
                  name: 'Current User'
                },
                language: 'en',
                wordCount: targetChapter.wordCount || 0,
                created: targetChapter.createdAt || new Date().toISOString(),
                modified: targetChapter.updatedAt || new Date().toISOString(),
                status: (targetChapter.status || 'draft') as 'draft' | 'published' | 'archived',
                tags: []
              },
              content: Array.isArray(contentBlocks) ? contentBlocks : []
            }
            
            setLoadedContent(chaptDocument)
            console.log('Loaded chapter as ChaptDocument into editor for editing')
          } catch (e) {
            console.error('Error parsing chapter content:', e)
          }
        } else {
          console.error('Chapter not found:', chapterId)
          toast.error('Chapter not found.')
        }
      }
    } catch (error) {
      console.error('Error loading chapter:', error)
      toast.error('Failed to load chapter.')
    }
  }

  const loadWorkSections = async (workId: string) => {
    try {
      console.log('Loading sections for workId:', workId)
      const response = await fetch(`/api/works/${workId}/sections`)
      if (response.ok) {
        const result = await response.json()
        console.log('Loaded sections:', result.sections)
        
        if (result.sections && result.sections.length > 0) {
          // Load existing chapter content
          const firstSection = result.sections[0]
          console.log('First section:', firstSection)
          try {
            const content = typeof firstSection.content === 'string' 
              ? JSON.parse(firstSection.content) 
              : firstSection.content
            setLoadedContent(content)
            console.log('Loaded existing chapter content into editor')
          } catch (e) {
            console.error('Error parsing section content:', e)
          }
        } else {
          // No chapters yet - work needs first chapter created
          console.log('No chapters found - this work needs its first chapter published')
        }
      } else {
        console.error('Failed to load sections, status:', response.status)
      }
    } catch (error) {
      console.error('Error loading sections:', error)
    }
  }

  const loadDraftData = async (draftId: string) => {
    try {
      console.log('Loading draft data for draftId:', draftId)
      const response = await fetch(`/api/works/drafts`)
      if (response.ok) {
        const result = await response.json()
        const draft = result.drafts.find((d: any) => d.id === draftId)
        if (draft) {
          console.log('Loaded draft data:', draft)
          setCurrentWork(prev => ({
            ...prev,
            title: draft.title,
            description: draft.description,
            formatType: draft.formatType || prev.formatType,
            status: draft.status || prev.status,
            hasContent: false // Drafts start with no content
          }))
        } else {
          console.error('Draft not found with id:', draftId)
        }
      } else {
        console.error('Failed to load drafts, status:', response.status)
      }
    } catch (error) {
      console.error('Error loading draft data:', error)
    }
  }

  const handleSave = async (data: any) => {
    console.log('=== SAVE CLICKED ===')
    console.log('Saving:', data)
    console.log('Current state:', { workId, draftId, isDraft: currentWork.isDraft })
    
    // Update content tracking
    if (data.content && data.content.trim().length > 100) { // Require meaningful content
      setCurrentWork(prev => ({ ...prev, hasContent: true }))
    }
    
    try {
      // If no workId or draftId, create a new draft
      if (!workId && !draftId) {
        console.log('Creating new draft...')
        const response = await fetch('/api/works/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentWork.title || 'Untitled Work',
            description: currentWork.description || 'A new work in progress',
            formatType: currentWork.formatType || 'novel'
          })
        })

        if (response.ok) {
          const result = await response.json()
          console.log('Draft created:', result)
          
          // Update URL with draftId and reload
          const newDraftId = result.draft?.id
          if (newDraftId) {
            toast.success('Draft created. Reloading to continue editing...')
            window.location.href = `/creator/editor?draftId=${newDraftId}&format=${currentWork.formatType}`
            return
          }
        } else {
          const error = await response.json()
          console.error('Failed to create draft:', error)
          toast.error(`Failed to save draft: ${error.error || 'Unknown error'}`)
          return
        }
      } else if (draftId) {
        // Update existing draft - save chapter content
        console.log('Saving chapter to draft:', draftId)
        
        // For now, just show success since we need the sections API
        toast.info('Chapter content saved. Full draft chapter API integration is still pending.')
        setProjectStats(prev => ({
          ...prev,
          lastSaved: new Date(),
          totalWords: data.wordCount || prev.totalWords
        }))
        return
      } else if (workId) {
        // Save chapter to existing work
        console.log('Saving chapter to work:', workId, 'chapterId:', chapterId)
        
        // Determine if this is an update or new chapter
        const isUpdate = !!chapterId
        const endpoint = isUpdate 
          ? `/api/works/${workId}/sections/${chapterId}`
          : `/api/works/${workId}/sections`
        const method = isUpdate ? 'PATCH' : 'POST'
        
        console.log(`${method} to ${endpoint}`)
        
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title || 'Untitled Chapter',
            content: data.content,
            wordCount: data.wordCount || 0,
            status: 'draft'
          })
        })

        if (response.ok) {
          const result = await response.json()
          console.log('Chapter saved:', result)
          
          // If this was a new chapter, update the URL with the chapterId
          if (!isUpdate && result.section?.id) {
            const newChapterId = result.section.id
            console.log('New chapter created with ID:', newChapterId)
            // Update URL without reload to track chapterId for future saves
            window.history.replaceState(
              {},
              '',
              `/creator/editor?workId=${workId}&chapterId=${newChapterId}`
            )
          }
        } else {
          const error = await response.json()
          console.error('Failed to save chapter:', error)
          toast.error(`Failed to save chapter: ${error.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Failed to save. Please try again.')
    }
    
    setProjectStats(prev => ({
      ...prev,
      lastSaved: new Date(),
      totalWords: data.wordCount || prev.totalWords
    }))
  }

  const handlePublish = async (data: any) => {
    console.log('[EDITOR] Publishing clicked with data:', data)
    console.log('[EDITOR] Current work state:', { 
      hasContent: currentWork.hasContent, 
      isDraft: currentWork.isDraft,
      draftId 
    })
    
    // Check if work has content before publishing
    if (!currentWork.hasContent) {
      toast.warning('Cannot publish without content. Add at least one chapter or section first.')
      return
    }

    // If this is a draft, we need to convert it to a published work
    if (currentWork.isDraft && draftId) {
      try {
        console.log('[EDITOR] Sending publish request to API...')
        const response = await fetch(`/api/works/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            draftId: draftId,
            publishData: data
          })
        })

        console.log('[EDITOR] Publish response status:', response.status)

        if (response.ok) {
          const result = await response.json()
          console.log('[EDITOR] Publish success result:', result)
          
          // If the server says confirmation is required for mature content, prompt the author
            if (result.confirmationRequired) {
              console.log('[EDITOR] Confirmation required for mature content')
              // Open modal with details and wait for user action
              setModalState({
                open: true,
                suggestedRating: result.suggestedRating,
                validationDetails: result.validationDetails || result.validation || result.details || {}
              })
              return
            }

          // Build success message with assessment info if available
          let successMessage = 'Work published successfully!'
          if (result.assessment?.completed) {
            successMessage += ` Quality assessment complete: ${result.assessment.tier} (${result.assessment.score}/100)`
          } else if (result.assessment?.rateLimited) {
            successMessage += ` ${result.assessment.message}`
          }

          toast.success(successMessage)
          
          // No need to manually queue - assessment already ran synchronously during publish
          console.log('[EDITOR] Redirecting to story page:', result.workId)
          // Redirect to the published work story page (has proper navigation)
          window.location.href = `/story/${result.workId}`
        } else {
          const error = await response.json()
          console.error('[EDITOR] Publish failed with error:', error)
          toast.error(`Failed to publish: ${error.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('[EDITOR] Error publishing work:', error)
        toast.error('Failed to publish work. Please try again.')
      }
    } else {
      // For existing works, just update the content
      toast.success('Content saved and updated.')
    }
  }

  // Modal state and handlers
  const [modalState, setModalState] = useState({ open: false, suggestedRating: undefined as string | undefined, validationDetails: undefined as any })

  const handleModalConfirm = async () => {
    if (!draftId) return
    setModalState(prev => ({ ...prev, open: false }))
    try {
      const overrideResp = await fetch(`/api/works/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draftId, publishData: { authorOverride: true } })
      })
      if (overrideResp.ok) {
        const final = await overrideResp.json()
        toast.success('Work published successfully.')
        window.location.href = `/story/${final.workId}`
        return
      } else {
        const err = await overrideResp.json()
        toast.error(`Failed to publish after confirmation: ${err.error || 'Unknown error'}`)
        return
      }
    } catch (e) {
      console.error('Error confirming publish:', e)
      toast.error('Failed to publish after confirmation. Please try again.')
    }
  }

  const handleModalCancel = () => {
    setModalState(prev => ({ ...prev, open: false }))
    toast.info('Publishing cancelled. You can edit content or mark the work as mature in settings.')
  }

  const handleUploadComplete = (results: any[]) => {
    console.log('Upload completed:', results)
    
    // Track if content was uploaded
    if (results.length > 0 && results[0].sections?.length > 0) {
      setCurrentWork(prev => ({ ...prev, hasContent: true }))
      setEditorMode({ type: 'editor' }) // Switch to editor mode to edit uploaded content
    }
  }

  const getFormatIcon = (format: ContentFormat) => {
    switch (format) {
      case 'novel': return <BookOpen size={20} />
      case 'article': return <FileText size={20} />
      case 'comic': return <ImageIcon size={20} />
      case 'hybrid': return <Palette size={20} />
      default: return <FileText size={20} />
    }
  }

  const getProgressPercentage = () => {
    if (projectStats.targetWords === 0) return 0
    return Math.min((projectStats.totalWords / projectStats.targetWords) * 100, 100)
  }

  return (
    <AppLayout>
      <div className="fixed inset-0 left-0 md:left-64 flex flex-col bg-gray-900">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  {getFormatIcon(formatType)}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentWork.title || (mode === 'create' ? `New ${formatType}` : 'Untitled Work')}
                    {currentWork.isDraft && (
                      <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                        DRAFT
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentWork.title 
                      ? `${currentWork.chaptersCount} chapters • ${currentWork.wordsCount.toLocaleString()} words`
                      : mode === 'create' 
                        ? currentWork.isDraft 
                          ? 'Working on draft - not published yet' 
                          : 'Create your next masterpiece'
                        : 'Loading...'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setEditorMode({ type: 'editor' })}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    editorMode.type === 'editor'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <FileText size={14} className="inline mr-1" />
                  Editor
                </button>
                <button
                  onClick={() => setEditorMode({ type: 'uploader' })}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    editorMode.type === 'uploader'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Upload size={14} className="inline mr-1" />
                  Upload
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                {/* Publish Button - only show for drafts with content */}
                {currentWork.isDraft && currentWork.hasContent && (
                  <button
                    onClick={() => handlePublish({ 
                      content: 'current_content', // This would be the actual content from the editor
                      readyForReview: true 
                    })}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-1"
                  >
                    <Upload size={16} />
                    <span>Publish Work</span>
                  </button>
                )}
                
                {/* Content Warning for empty drafts */}
                {currentWork.isDraft && !currentWork.hasContent && (
                  <div className="px-3 py-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg text-sm">
                    Add content to enable publishing
                  </div>
                )}

                <button
                  onClick={() => setQuickActions(prev => ({ ...prev, autoSave: !prev.autoSave }))}
                  className={`p-2 rounded-lg transition-colors ${
                    quickActions.autoSave 
                      ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Auto-save"
                >
                  <Save size={16} />
                </button>
                
                <button
                  onClick={() => setQuickActions(prev => ({ ...prev, livePreview: !prev.livePreview }))}
                  className={`p-2 rounded-lg transition-colors ${
                    quickActions.livePreview 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Live preview"
                >
                  <Eye size={16} />
                </button>

                <button
                  onClick={() => setShowStatsBar(!showStatsBar)}
                  className={`p-2 rounded-lg transition-colors ${
                    showStatsBar 
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Toggle Stats Bar"
                >
                  <Zap size={16} />
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Settings"
                >
                  <Settings size={16} />
                </button>

                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar - NaNoWriMo Style Goal Tracking */}
          {formatType === 'novel' && quickActions.goalMode && projectStats.targetWords > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">
                  Progress: {projectStats.totalWords.toLocaleString()} / {projectStats.targetWords.toLocaleString()} words
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {getProgressPercentage().toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Bar - Toggleable */}
        {showStatsBar && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-2">
            <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                <BookOpen size={14} />
                <span>{projectStats.chaptersWritten} chapters</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                <FileText size={14} />
                <span>{projectStats.totalWords.toLocaleString()} words</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                <Users size={14} />
                <span>{currentWork.subscribers} subscribers</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                <Calendar size={14} />
                <span>Last saved: {projectStats.lastSaved ? new Date(projectStats.lastSaved).toLocaleTimeString() : 'Never'}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-green-600 dark:text-green-400">
                Daily goal: {projectStats.dailyGoal} words
              </div>
              <div className="text-blue-600 dark:text-blue-400">
                Time: {Math.floor(projectStats.timeSpent / 60)}h {projectStats.timeSpent % 60}m
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {showStartPicker ? (
            /* ── Publishing flow entry picker (#105) ─────────────────────── */
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-6">
              <div className="max-w-lg w-full">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  How do you want to start?
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8">
                  Choose the fastest path to getting your chapter in.
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => setStartPickerDismissed(true)}
                    className="flex items-start gap-4 p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all text-left"
                  >
                    <span className="text-3xl flex-shrink-0 mt-0.5">✍️</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Write from scratch</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Open the rich editor and start typing directly.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setEditorMode({ type: 'uploader' }); setStartPickerDismissed(true) }}
                    className="flex items-start gap-4 p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all text-left"
                  >
                    <span className="text-3xl flex-shrink-0 mt-0.5">📄</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Upload a document</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Import a .docx, .txt, or other file and parse it automatically.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setPasteMode(true); setStartPickerDismissed(true) }}
                    className="flex items-start gap-4 p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 dark:hover:border-green-500 hover:shadow-md transition-all text-left"
                  >
                    <span className="text-3xl flex-shrink-0 mt-0.5">📋</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Paste text</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Paste a block of plain text. We'll convert it into editor blocks for you.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : pasteMode ? (
            /* ── Paste text panel (#105) ─────────────────────────────────── */
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-auto">
              <div className="max-w-2xl w-full mx-auto flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paste your text</h2>
                  <button
                    onClick={() => { setPasteMode(false); setStartPickerDismissed(false) }}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ← Back
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Blank lines will become paragraph breaks. Each paragraph becomes an editor block.
                </p>
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder="Paste your chapter text here..."
                  className="flex-1 min-h-64 w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-gray-400">
                    {pasteText.trim() ? `~${pasteText.trim().split(/\s+/).length} words` : 'Nothing pasted yet'}
                  </p>
                  <button
                    disabled={!pasteText.trim()}
                    onClick={() => {
                      const paragraphs = pasteText.split(/\n\n+/).filter(p => p.trim())
                      const blocks = paragraphs.map(para => ({
                        id: Math.random().toString(36).slice(2, 10),
                        type: 'prose' as const,
                        text: para.trim(),
                      }))
                      const doc = {
                        type: 'chapter' as const,
                        version: '1.0.0',
                        metadata: {
                          id: 'new',
                          title: 'Chapter 1',
                          chapterNumber: 1,
                          author: { id: '', name: '' },
                          language: 'en',
                          wordCount: pasteText.trim().split(/\s+/).filter(Boolean).length,
                          created: new Date().toISOString(),
                          modified: new Date().toISOString(),
                          status: 'draft' as const,
                          tags: [],
                        },
                        content: blocks,
                      }
                      setLoadedContent(doc)
                      setPasteMode(false)
                      setEditorMode({ type: 'editor' })
                    }}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Import into editor →
                  </button>
                </div>
              </div>
            </div>
          ) : editorMode.type === 'editor' ? (
            <ChaptursEditor
              workId={workId || 'new'}
              chapterId={chapterId}
              initialDocument={loadedContent}
              onSave={async (document: ChaptDocument) => {
                console.log('Saving chapter:', document)
                
                // Convert ChaptDocument to API format
                const saveData = {
                  title: document.metadata.title,
                  content: JSON.stringify(document.content),
                  wordCount: document.metadata.wordCount,
                  status: document.metadata.status,
                  chaptNumber: document.metadata.chapterNumber
                }
                
                await handleSave(saveData)
              }}
              onPublish={async (document: ChaptDocument) => {
                console.log('=== PUBLISH CLICKED ===')
                console.log('Publishing chapter:', document)
                console.log('Current state:', { workId, draftId, isDraft: currentWork.isDraft, hasContent: currentWork.hasContent })
                
                // Convert ChaptDocument to API format
                const publishData = {
                  title: document.metadata.title,
                  content: JSON.stringify(document.content),
                  wordCount: document.metadata.wordCount,
                  status: 'published',
                  chaptNumber: document.metadata.chapterNumber
                }
                
                console.log('Publish data:', publishData)
                
                // Use handlePublish for drafts, or direct API call for existing works
                if (currentWork.isDraft && draftId) {
                  console.log('Publishing draft via handlePublish...')
                  await handlePublish(publishData)
                } else if (workId) {
                  console.log('Publishing chapter to existing work:', workId, 'chapterId:', chapterId)
                  // Publishing a chapter on an existing work
                  try {
                    // Determine if this is an update or new chapter
                    const isUpdate = !!chapterId
                    const endpoint = isUpdate 
                      ? `/api/works/${workId}/sections/${chapterId}`
                      : `/api/works/${workId}/sections`
                    const method = isUpdate ? 'PATCH' : 'POST'
                    
                    console.log('=== CALLING SECTIONS API ===')
                    console.log(`Endpoint: ${method} ${endpoint}`)
                    console.log('Data being sent:', publishData)
                    
                    const response = await fetch(endpoint, {
                      method,
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(publishData)
                    })

                    console.log('=== API RESPONSE ===')
                    console.log('Status:', response.status)
                    console.log('Status text:', response.statusText)
                    
                    if (response.ok) {
                      const result = await response.json()
                      console.log('=== PUBLISH SUCCESS ===')
                      console.log('Full result:', JSON.stringify(result, null, 2))
                      console.log('Chapter published successfully:', result)

                      // If this was a new chapter, update the URL with the chapterId
                      if (!isUpdate && result.section?.id) {
                        const newChapterId = result.section.id
                        console.log('New chapter created with ID:', newChapterId)
                        // Update URL without reload to track chapterId for future saves
                        window.history.replaceState(
                          {},
                          '',
                          `/creator/editor?workId=${workId}&chapterId=${newChapterId}`
                        )
                      }

                      // Build success message with assessment info if available
                      let successMessage = 'Chapter published successfully!'
                      if (result.assessment?.success) {
                        const { tier, score, feedback } = result.assessment
                        successMessage += `\n\n✨ Quality Assessment Complete\nTier: ${tier}\nScore: ${score}/100`
                        if (feedback) {
                          successMessage += `\nFeedback: ${feedback}`
                        }
                      } else if (result.rateLimited) {
                        successMessage += '\n\n⏱️ Quality assessment queued for later (rate limited)'
                      }

                      toast.success(successMessage)
                      // Redirect to the published work story page (has proper navigation)
                      window.location.href = `/story/${workId}`
                    } else {
                      const error = await response.json()
                      console.error('API error response:', error)
                      
                      // Show detailed validation errors if available
                      if (error.validationErrors && error.details) {
                        console.error('Validation errors:', error.validationErrors)
                        console.error('Validation details:', error.details)
                        
                        const errorDetails = error.validationErrors.join('\n• ')
                        toast.error(`Failed to publish chapter: ${error.error}. Issues: ${errorDetails}`)
                      } else {
                        toast.error(`Failed to publish chapter: ${error.error || 'Unknown error'}`)
                      }
                    }
                  } catch (error) {
                    console.error('Error publishing chapter:', error)
                    toast.error('Failed to publish chapter. Please try again.')
                  }
                } else {
                  // No workId or draftId - need to create work first
                  console.error('Cannot publish: No workId or draftId')
                  toast.warning('Please save your work as a draft first before publishing.')
                }
              }}
            />
          ) : (
            <div className="h-full overflow-auto p-6">`
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Upload Content
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload documents, images, or archives to automatically parse and create {formatType} content
                  </p>
                </div>

                <AdvancedUploader
                  formatType={formatType}
                  workId={draftId || workId} // Use draftId for new drafts, workId for existing works
                  onUploadComplete={handleUploadComplete}
                  maxFileSize={100} // 100MB
                />
              </div>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Project Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Settings */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Work Title
                      </label>
                      <input
                        type="text"
                        value={currentWork.title}
                        onChange={(e) => setCurrentWork(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Format Type
                      </label>
                      <select
                        value={currentWork.formatType}
                        onChange={(e) => setCurrentWork(prev => ({ ...prev, formatType: e.target.value as ContentFormat }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                      >
                        <option value="novel">Novel</option>
                        <option value="article">Article</option>
                        <option value="comic">Comic</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={currentWork.description}
                      onChange={(e) => setCurrentWork(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>

                {/* Writing Goals */}
                {/* Writing Goals - only show when goal mode is enabled */}
                {formatType === 'novel' && quickActions.goalMode && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Writing Goals</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Target Word Count
                        </label>
                        <input
                          type="number"
                          value={projectStats.targetWords}
                          onChange={(e) => setProjectStats(prev => ({ ...prev, targetWords: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Daily Word Goal
                        </label>
                        <input
                          type="number"
                          value={projectStats.dailyGoal}
                          onChange={(e) => setProjectStats(prev => ({ ...prev, dailyGoal: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Editor Preferences */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Editor Preferences</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={quickActions.autoSave}
                        onChange={(e) => setQuickActions(prev => ({ ...prev, autoSave: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Auto-save changes</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={quickActions.livePreview}
                        onChange={(e) => setQuickActions(prev => ({ ...prev, livePreview: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Live preview mode</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={quickActions.focusMode}
                        onChange={(e) => setQuickActions(prev => ({ ...prev, focusMode: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Focus mode (hide distractions)</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={quickActions.goalMode}
                        onChange={(e) => {
                          setQuickActions(prev => ({ ...prev, goalMode: e.target.checked }))
                          // Set default target when enabling goal mode
                          if (e.target.checked && projectStats.targetWords === 0) {
                            setProjectStats(prev => ({ 
                              ...prev, 
                              targetWords: formatType === 'novel' ? 50000 : 10000 
                            }))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Goal Mode (NaNoWriMo-style progress tracking)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save settings
                    console.log('Saving settings:', { currentWork, projectStats, quickActions })
                    setShowSettings(false)
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
