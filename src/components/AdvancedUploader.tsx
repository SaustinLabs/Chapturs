'use client'

import React, { useState, useCallback, useRef } from 'react'
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Archive, 
  X, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Eye,
  Calendar,
  Settings,
  Zap,
  BookOpen,
  FileImage,
  Download
} from 'lucide-react'
import { ContentFormat } from '@/types'
import { useToast } from '@/components/ui/Toast'

interface FileUploadResult {
  id: string
  fileName: string
  fileType: string
  size: number
  status: 'processing' | 'completed' | 'error'
  sections?: ProcessedSection[]
  preview?: string
  error?: string
}

interface ProcessedSection {
  title: string
  content: any
  order: number
  wordCount?: number
  type: 'chapter' | 'section' | 'page' | 'poem'
}

interface AdvancedUploaderProps {
  formatType: ContentFormat
  workId?: string
  onUploadComplete?: (results: FileUploadResult[]) => void
  onSectionSelect?: (section: ProcessedSection) => void
  maxFileSize?: number // in MB
  allowedFormats?: string[]
}

export default function AdvancedUploader({
  formatType,
  workId,
  onUploadComplete,
  onSectionSelect,
  maxFileSize = 50,
  allowedFormats
}: AdvancedUploaderProps) {
  const { toast } = useToast()
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadResult[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [schedulingMode, setSchedulingMode] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  // Schedule settings
  const [scheduleSettings, setScheduleSettings] = useState({
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    frequency: 'weekly' as 'daily' | 'weekly' | 'biweekly' | 'monthly',
    autoPublish: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get accepted file types based on format
  const getAcceptedTypes = useCallback(() => {
    const baseTypes = allowedFormats || []
    
    switch (formatType) {
      case 'novel':
        return ['.docx', '.txt', '.md', '.odt', '.rtf', '.pdf', ...baseTypes]
      case 'article':
        return ['.docx', '.txt', '.md', '.odt', '.rtf', '.pdf', ...baseTypes]
      case 'comic':
        return ['.zip', '.rar', '.cbz', '.cbr', '.7z', '.jpg', '.jpeg', '.png', '.gif', '.webp', ...baseTypes]
      case 'hybrid':
        return ['.docx', '.txt', '.md', '.odt', '.rtf', '.pdf', '.zip', '.jpg', '.jpeg', '.png', ...baseTypes]
      default:
        return ['.txt', '.docx', '.md', ...baseTypes]
    }
  }, [formatType, allowedFormats])

  // File size validation
  const validateFileSize = useCallback((file: File): boolean => {
    const sizeInMB = file.size / (1024 * 1024)
    return sizeInMB <= maxFileSize
  }, [maxFileSize])

  // File type validation
  const validateFileType = useCallback((file: File): boolean => {
    const acceptedTypes = getAcceptedTypes()
    return acceptedTypes.some(type => file.name.toLowerCase().endsWith(type))
  }, [getAcceptedTypes])

  // Process uploaded files based on format type
  const processFile = useCallback(async (file: File): Promise<FileUploadResult> => {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))

    // Simulate processing progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[fileId] || 0
        if (current >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        return { ...prev, [fileId]: current + Math.random() * 10 }
      })
    }, 200)

    try {
      let sections: ProcessedSection[] = []
      let preview = ''

      // Process based on file type
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text()
        sections = await processTextFile(text, formatType)
        preview = text.substring(0, 500) + (text.length > 500 ? '...' : '')
      } 
      else if (file.name.endsWith('.docx') || file.name.toLowerCase().endsWith('.pdf')) {
        sections = await parseDocumentFile(file)
        preview = `${file.name} parsed successfully`
      }
      else if (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        sections = await processImageFile(file)
        preview = URL.createObjectURL(file)
      }
      else if (file.name.match(/\.(zip|rar|cbz|cbr|7z)$/i)) {
        sections = await processArchiveFile(file)
        preview = `Archive containing ${sections.length} items`
      }

      // Complete progress
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
      clearInterval(progressInterval)

      return {
        id: fileId,
        fileName: file.name,
        fileType: file.type || 'unknown',
        size: file.size,
        status: 'completed',
        sections,
        preview
      }
    } catch (error) {
      clearInterval(progressInterval)
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
      
      return {
        id: fileId,
        fileName: file.name,
        fileType: file.type || 'unknown',
        size: file.size,
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed'
      }
    }
  }, [formatType])

  // Process text files into sections
  const processTextFile = async (text: string, format: ContentFormat): Promise<ProcessedSection[]> => {
    const sections: ProcessedSection[] = []

    if (format === 'novel') {
      // Split by chapter markers
      const chapterRegex = /(^|\n)\s*(chapter\s+\d+|ch\s*\d+|\d+\.|\*\*\*)/i
      const parts = text.split(chapterRegex).filter(part => part.trim())
      
      let chapterNumber = 1
      for (let i = 0; i < parts.length; i += 2) {
        const title = parts[i]?.trim() || `Chapter ${chapterNumber}`
        const content = parts[i + 1]?.trim() || ''
        
        if (content) {
          sections.push({
            title: title.substring(0, 100),
            content: content,
            order: chapterNumber,
            wordCount: content.split(/\s+/).length,
            type: 'chapter'
          })
          chapterNumber++
        }
      }
    } else if (format === 'article') {
      // Split by section headers
      const sectionRegex = /(^|\n)\s*(#{1,3}\s+.+|\*\*[^*]+\*\*|[A-Z][^.!?]*[.!?]$)/gm
      const parts = text.split(sectionRegex).filter(part => part.trim())
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim()
        if (part) {
          const isHeader = part.match(/^#{1,3}\s+.+|\*\*[^*]+\*\*/)
          sections.push({
            title: isHeader ? part.replace(/[#*]/g, '').trim() : `Section ${i + 1}`,
            content: part,
            order: i + 1,
            wordCount: part.split(/\s+/).length,
            type: 'section'
          })
        }
      }
    }

    return sections.length > 0 ? sections : [
      {
        title: 'Imported Content',
        content: text,
        order: 1,
        wordCount: text.split(/\s+/).length,
        type: 'section'
      }
    ]
  }

  // Parse DOCX or PDF via server-side API, then split into sections
  const parseDocumentFile = async (file: File): Promise<ProcessedSection[]> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload/parse-document', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Failed to parse ${file.name}`)
    }

    const { text } = await res.json()
    if (!text?.trim()) {
      throw new Error('No readable text found in this document. It may be a scanned image PDF.')
    }

    const sections = await processTextFile(text, formatType)
    return sections
  }

  // Process image files
  const processImageFile = async (file: File): Promise<ProcessedSection[]> => {
    return [
      {
        title: file.name.replace(/\.[^/.]+$/, ''),
        content: {
          type: 'image',
          url: URL.createObjectURL(file),
          alt: file.name
        },
        order: 1,
        type: 'page'
      }
    ]
  }

  // Process archive files
  const processArchiveFile = async (file: File): Promise<ProcessedSection[]> => {
    // In production, this would extract and process archive contents
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Simulate finding multiple images/files in archive
    const mockFiles = Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => ({
      title: `Page ${i + 1}`,
      content: {
        type: 'image',
        url: '/placeholder-comic-page.jpg',
        alt: `Page ${i + 1}`
      },
      order: i + 1,
      type: 'page' as const
    }))

    return mockFiles
  }

  // Handle file drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    await handleFiles(files)
  }, [])

  // Handle files
  const handleFiles = useCallback(async (files: File[]) => {
    setProcessing(true)
    const validFiles = files.filter(file => {
      if (!validateFileSize(file)) {
        toast.warning(`${file.name} is too large. Max size is ${maxFileSize}MB.`)
        return false
      }
      if (!validateFileType(file)) {
        toast.warning(`${file.name} is not a supported format.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) {
      setProcessing(false)
      return
    }

    try {
      const results = await Promise.all(validFiles.map(processFile))
      setUploadedFiles(prev => [...prev, ...results])
      onUploadComplete?.(results)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setProcessing(false)
    }
  }, [processFile, validateFileSize, validateFileType, maxFileSize, onUploadComplete])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }, [handleFiles])

  // Remove uploaded file
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[fileId]
      return newProgress
    })
  }, [])

  // Schedule publishing
  const handleSchedulePublish = useCallback(() => {
    const scheduledFiles = uploadedFiles.filter(file => file.status === 'completed')
    console.log('Scheduling publication:', {
      files: scheduledFiles,
      settings: scheduleSettings
    })
    
    // In production, this would call an API to set up the publishing schedule
    toast.success(`Scheduled ${scheduledFiles.length} file${scheduledFiles.length !== 1 ? 's' : ''} for publication starting ${scheduleSettings.startDate}`)
    setSchedulingMode(false)
  }, [uploadedFiles, scheduleSettings])

  const acceptedTypes = getAcceptedTypes().join(',')

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${processing ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="text-4xl">
            {formatType === 'comic' ? '🎨' : formatType === 'novel' ? '📚' : formatType === 'article' ? '📄' : '📝'}
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Upload your {formatType} content
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Drag and drop files here, or click to browse
            </p>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload size={16} className="mr-2" />
              Choose Files
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple={formatType === 'comic'}
              accept={acceptedTypes}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>Supported formats: {getAcceptedTypes().join(', ')}</p>
            <p>Maximum file size: {maxFileSize}MB</p>
            {formatType === 'comic' && <p>For comics: Upload individual images or zip archives</p>}
            {formatType === 'novel' && <p>Auto-detection of chapters and sections</p>}
          </div>
        </div>
      </div>

      {/* Processing Indicator */}
      {processing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-blue-700 dark:text-blue-300">Processing files...</span>
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSchedulingMode(true)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center"
              >
                <Calendar size={14} className="mr-1" />
                Schedule
              </button>
              <button
                onClick={() => {
                  const completedFiles = uploadedFiles.filter(f => f.status === 'completed')
                  toast.info(`Publishing ${completedFiles.length} file${completedFiles.length !== 1 ? 's' : ''} immediately`)
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center"
              >
                <Zap size={14} className="mr-1" />
                Publish Now
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">
                      {file.fileType.startsWith('image/') ? <FileImage /> : 
                       file.fileName.endsWith('.docx') ? <FileText /> :
                       file.fileName.match(/\.(zip|rar)$/i) ? <Archive /> : <FileText />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {file.fileName}
                      </h4>
                      
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                        <span className="flex items-center">
                          {file.status === 'completed' && <CheckCircle size={14} className="text-green-500 mr-1" />}
                          {file.status === 'error' && <AlertCircle size={14} className="text-red-500 mr-1" />}
                          {file.status === 'processing' && <Clock size={14} className="text-yellow-500 mr-1" />}
                          {file.status}
                        </span>
                        {file.sections && <span>{file.sections.length} sections detected</span>}
                      </div>

                      {/* Progress bar */}
                      {uploadProgress[file.id] !== undefined && uploadProgress[file.id] < 100 && (
                        <div className="mt-2">
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[file.id]}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Preview */}
                      {file.preview && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                          {file.fileType.startsWith('image/') ? (
                            <img 
                              src={file.preview} 
                              alt="Preview" 
                              className="max-w-32 max-h-32 object-cover rounded"
                            />
                          ) : (
                            <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{file.preview}</p>
                          )}
                        </div>
                      )}

                      {/* Error message */}
                      {file.error && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                          {file.error}
                        </div>
                      )}

                      {/* Sections */}
                      {file.sections && file.sections.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Detected Sections:
                          </h5>
                          <div className="space-y-1">
                            {file.sections.map((section, index) => (
                              <button
                                key={index}
                                onClick={() => onSectionSelect?.(section)}
                                className="w-full text-left p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{section.title}</span>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                    {section.wordCount && <span>{section.wordCount} words</span>}
                                    <Eye size={12} />
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduling Modal */}
      {schedulingMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Schedule Publication</h3>
              <button
                onClick={() => setSchedulingMode(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={scheduleSettings.startDate}
                  onChange={(e) => setScheduleSettings(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={scheduleSettings.startTime}
                  onChange={(e) => setScheduleSettings(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Publishing Frequency
                </label>
                <select
                  value={scheduleSettings.frequency}
                  onChange={(e) => setScheduleSettings(prev => ({ 
                    ...prev, 
                    frequency: e.target.value as 'daily' | 'weekly' | 'biweekly' | 'monthly'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoPublish"
                  checked={scheduleSettings.autoPublish}
                  onChange={(e) => setScheduleSettings(prev => ({ ...prev, autoPublish: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoPublish" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Auto-publish sections
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setSchedulingMode(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedulePublish}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Schedule Publication
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
