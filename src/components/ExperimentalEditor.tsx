'use client'

import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { 
  BeakerIcon,
  EyeIcon,
  Bars3Icon,
  PhotoIcon,
  ClockIcon,
  ShareIcon,
  PlusIcon,
  XMarkIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  Bars4Icon,
  ListBulletIcon,
  LinkIcon,
  SparklesIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline'

// Import mode components
import VisualNovelMode from './experimental/VisualNovelMode'
import WorldbuildingMode from './experimental/WorldbuildingMode'
import BranchingStoryModeSimple from './experimental/BranchingStoryModeSimple'
import EmojiPicker from './EmojiPicker'
import { useToast } from '@/components/ui/Toast'

export type ExperimentalMode = 'normal' | 'visual-novel' | 'worldbuilding' | 'branching-story' | 'placeholder'

interface ExperimentalData {
  visualNovel?: {
    characters: Array<{
      id: string
      name: string
      portraits: Array<{
        id: string
        url: string
        expression: string
      }>
    }>
    backgrounds: Array<{
      id: string
      url: string
      name: string
    }>
    scenes: Array<{
      id: string
      speaker?: string
      portraitId?: string
      backgroundId?: string
      text: string
      order: number
    }>
  }
  worldbuilding?: {
    events: Array<{
      id: string
      title: string
      date: string
      description: string
      tags: string[]
      linkedContent?: string[]
    }>
    relationships: Array<{
      id: string
      fromEntity: string
      toEntity: string
      relationship: string
    }>
  }
  branchingStory?: {
    nodes: Array<{
      id: string
      title: string
      content: string
      choices: Array<{
        id: string
        text: string
        targetNodeId: string
        effects?: Record<string, number>
      }>
      position: { x: number; y: number }
    }>
    flags: Record<string, number>
  }
}

interface GlossaryEntry {
  id: string
  term: string
  definition: string
  chapterIntroduced: number
  createdAt: Date
  updatedAt: Date
}

interface ChapterData {
  id: string
  number: number
  title: string
  content: any // Tiptap JSON content
  wordCount: number
  status: 'draft' | 'review' | 'published'
  publishDate?: Date
  glossaryEntries: string[] // IDs of glossary entries introduced in this chapter
}

interface ExperimentalEditorProps {
  workId?: string
  initialContent?: string
  initialData?: ExperimentalData
  onSave?: (content: string, data: any) => void
}

export default function ExperimentalEditor({ 
  workId, 
  initialContent = '', 
  initialData = {},
  onSave 
}: ExperimentalEditorProps) {
  const { toast } = useToast()
  const [currentMode, setCurrentMode] = useState<ExperimentalMode>('normal')
  const [experimentalData, setExperimentalData] = useState<ExperimentalData>(initialData)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [showGlossaryModal, setShowGlossaryModal] = useState(false)
  const [currentGlossaryEntry, setCurrentGlossaryEntry] = useState<{ term: string; definition: string }>({ term: '', definition: '' })
  
  // Chapter and content management
  const [currentChapter, setCurrentChapter] = useState<ChapterData>({
    id: `chapter_${Date.now()}`,
    number: 1,
    title: '',
    content: null,
    wordCount: 0,
    status: 'draft',
    glossaryEntries: []
  })
  const [chapters, setChapters] = useState<ChapterData[]>([])
  const [glossaryEntries, setGlossaryEntries] = useState<GlossaryEntry[]>([])
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'chapters' | 'glossary' | 'settings'>('chapters')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Curated font families for readability
  const fontFamilies = [
    'Inter',
    'Source Serif Pro', 
    'Merriweather',
    'Georgia',
    'Times New Roman',
    'Crimson Text',
    'Libre Baskerville',
    'Lora',
    'PT Serif',
    'Playfair Display'
  ]

  // Initialize Tiptap editor with full feature set
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Typography,
      TextStyle, // Required for FontFamily and Color
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color.configure({
        types: ['textStyle'],
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      CharacterCount,
      Placeholder.configure({
        placeholder: 'Start writing your experimental content...',
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none p-6',
      },
    },
    onUpdate: ({ editor }) => {
      const wordCount = editor.storage.characterCount.words()
      setCurrentChapter(prev => ({
        ...prev,
        content: editor.getJSON(),
        wordCount
      }))
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const text = editor.state.doc.textBetween(from, to, '')
      setSelectedText(text)
    },
  })

  // Initialize first chapter if none exist
  useEffect(() => {
    if (chapters.length === 0 && currentChapter.title === '' && editor?.isEmpty) {
      setChapters([currentChapter])
    }
  }, [chapters.length, currentChapter, editor])

  const handleModeChange = (mode: ExperimentalMode) => {
    setCurrentMode(mode)
    setShowPreview(false)
  }

  const handleSave = async () => {
    if (editor && onSave) {
      const updatedChapters = chapters.map(ch => 
        ch.id === currentChapter.id ? currentChapter : ch
      )
      
      const saveData = {
        chapters: updatedChapters,
        glossary: glossaryEntries,
        experimentalData,
        content: editor.getHTML(),
        wordCount: editor.storage.characterCount.words()
      }
      
      console.log('Saving work:', saveData)
      onSave(editor.getHTML(), saveData)
      
      // Show success feedback
      toast.success('Work saved successfully!')
    }
  }

  const handlePublish = async () => {
    if (!currentChapter.title.trim()) {
      toast.warning('Please add a chapter title before publishing.')
      return
    }

    if (editor && editor.isEmpty) {
      toast.warning('Please add some content before publishing.')
      return
    }

    const updatedChapter = {
      ...currentChapter,
      status: 'published' as const,
      publishDate: new Date()
    }
    
    setCurrentChapter(updatedChapter)
    
    const updatedChapters = chapters.map(ch => 
      ch.id === currentChapter.id ? updatedChapter : ch
    )
    setChapters(updatedChapters)
    
    toast.success('Chapter published successfully!')
  }
  }
  }

  const handleAddChapter = () => {
    const newChapter: ChapterData = {
      id: `chapter_${Date.now()}`,
      number: chapters.length + 1,
      title: '',
      content: null,
      wordCount: 0,
      status: 'draft',
      glossaryEntries: []
    }
    
    setChapters(prev => [...prev, newChapter])
    setCurrentChapter(newChapter)
    editor?.commands.clearContent()
  }

  const handleSelectChapter = (chapter: ChapterData) => {
    setCurrentChapter(chapter)
    if (chapter.content) {
      editor?.commands.setContent(chapter.content)
    } else {
      editor?.commands.clearContent()
    }
  }

  const handleInsertImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const handleInsertLink = () => {
    const url = window.prompt('Enter link URL:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const handleAddGlossaryEntry = (term: string) => {
    if (!term.trim()) return
    setCurrentGlossaryEntry({ term: term.trim(), definition: '' })
    setShowGlossaryModal(true)
  }

  const handleSaveGlossaryEntry = () => {
    if (currentGlossaryEntry.term && currentGlossaryEntry.definition) {
      const newEntry: GlossaryEntry = {
        id: `glossary_${Date.now()}`,
        term: currentGlossaryEntry.term,
        definition: currentGlossaryEntry.definition,
        chapterIntroduced: currentChapter.number,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setGlossaryEntries(prev => [...prev, newEntry])
      setCurrentChapter(prev => ({
        ...prev,
        glossaryEntries: [...prev.glossaryEntries, newEntry.id]
      }))
      
      setShowGlossaryModal(false)
      setCurrentGlossaryEntry({ term: '', definition: '' })
      
      console.log('Glossary entry saved:', newEntry)
    }
  }

  const modes = [
    { id: 'normal', name: 'Normal Writing', icon: Bars3Icon, description: 'Standard rich text editing' },
    { id: 'visual-novel', name: 'Visual Novel', icon: PhotoIcon, description: 'Character portraits & backgrounds' },
    { id: 'worldbuilding', name: 'Worldbuilding', icon: ClockIcon, description: 'Timeline & relationship mapping' },
    { id: 'branching-story', name: 'Branching Story', icon: ShareIcon, description: 'Interactive choice-based narrative' },
    { id: 'placeholder', name: 'Future Mode', icon: PlusIcon, description: 'Reserved for new features' },
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BeakerIcon className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Experimental Editor
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Mode: {modes.find(m => m.id === currentMode)?.name}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Publish Chapter
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mt-4 flex space-x-2 overflow-x-auto">
          {modes.map((mode) => {
            const Icon = mode.icon
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id as ExperimentalMode)}
                className={`flex items-center px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  currentMode === mode.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={mode.description}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{mode.name}</span>
                {mode.id === 'placeholder' && (
                  <span className="ml-2 text-xs bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Rich Text Toolbar */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Format toggles */}
            <div className="flex items-center space-x-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
              <button
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`p-2 rounded ${editor?.isActive('bold') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Bold"
              >
                <BoldIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`p-2 rounded ${editor?.isActive('italic') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Italic"
              >
                <ItalicIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                className={`p-2 rounded ${editor?.isActive('strike') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Strikethrough"
              >
                <UnderlineIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Heading controls */}
            <div className="flex items-center space-x-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
              <button
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`px-2 py-1 rounded text-sm font-medium ${editor?.isActive('heading', { level: 1 }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Heading 1"
              >
                H1
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-2 py-1 rounded text-sm font-medium ${editor?.isActive('heading', { level: 2 }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Heading 2"
              >
                H2
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`px-2 py-1 rounded text-sm font-medium ${editor?.isActive('heading', { level: 3 }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Heading 3"
              >
                H3
              </button>
            </div>

            {/* Lists */}
            <div className="flex items-center space-x-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
              <button
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded ${editor?.isActive('bulletList') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Bullet List"
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded ${editor?.isActive('orderedList') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Numbered List"
              >
                <Bars4Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                className={`px-2 py-1 rounded text-sm ${editor?.isActive('blockquote') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Quote"
              >
                "
              </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center space-x-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
              <button
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                className={`px-2 py-1 rounded text-xs ${editor?.isActive({ textAlign: 'left' }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Align Left"
              >
                ←
              </button>
              <button
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                className={`px-2 py-1 rounded text-xs ${editor?.isActive({ textAlign: 'center' }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Align Center"
              >
                ↔
              </button>
              <button
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                className={`px-2 py-1 rounded text-xs ${editor?.isActive({ textAlign: 'right' }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Align Right"
              >
                →
              </button>
            </div>

            {/* Media */}
            <div className="flex items-center space-x-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
              <button
                onClick={handleInsertImage}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Insert Image"
              >
                <PhotoIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleInsertLink}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Insert Link"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${showEmojiPicker ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                  title="Insert Emoji"
                >
                  <FaceSmileIcon className="w-4 h-4" />
                </button>
                {showEmojiPicker && (
                  <EmojiPicker
                    onSelect={(emoji) => {
                      editor?.chain().focus().insertContent(emoji).run()
                      setShowEmojiPicker(false)
                    }}
                    onClose={() => setShowEmojiPicker(false)}
                    position="bottom-left"
                  />
                )}
              </div>
            </div>

            {/* Font controls */}
            <select
              value={fontFamily}
              onChange={(e) => {
                setFontFamily(e.target.value)
                editor?.chain().focus().setFontFamily(e.target.value).run()
              }}
              className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm"
              title="Font Family"
            >
              {fontFamilies.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          {/* Word count and selected text tools */}
          <div className="flex items-center space-x-3">
            {selectedText && (
              <div className="flex items-center space-x-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                <button
                  onClick={() => handleAddGlossaryEntry(selectedText)}
                  className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800"
                  title="Add to Glossary"
                >
                  <SparklesIcon className="w-3 h-3 mr-1 inline" />
                  Define
                </button>
              </div>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {editor?.storage.characterCount.words() || 0} words
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="flex-1 flex flex-col">
          {/* Chapter Title */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <input
              type="text"
              value={currentChapter.title}
              onChange={(e) => setCurrentChapter(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Chapter title..."
              className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
            />
            <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Chapter {currentChapter.number}</span>
              <span className="mx-2">•</span>
              <span>{currentChapter.status}</span>
              <span className="mx-2">•</span>
              <span>{currentChapter.wordCount} words</span>
            </div>
          </div>

          {/* Rich Text Editor */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-4xl mx-auto p-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm min-h-[400px] p-8 focus-within:border-blue-300 dark:focus-within:border-blue-600 transition-colors">
                <EditorContent 
                  editor={editor} 
                  className="prose prose-lg dark:prose-invert max-w-none min-h-[300px] focus:outline-none"
                  style={{ fontFamily: fontFamily }}
                />
              </div>
            </div>
            {editor && (
              <div className="px-6 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                  <span>{editor.storage.characterCount.characters()} characters, {editor.storage.characterCount.words()} words</span>
                  {selectedText && (
                    <span className="text-purple-600 dark:text-purple-400">
                      "{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}" selected
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mode-Specific Content */}
          <div className="flex-1 overflow-y-auto">
            {currentMode === 'visual-novel' && (
              <VisualNovelMode
                data={experimentalData.visualNovel}
                onChange={(data: any) => setExperimentalData(prev => ({ ...prev, visualNovel: data }))}
                preview={showPreview}
              />
            )}
            
            {currentMode === 'worldbuilding' && (
              <WorldbuildingMode
                data={experimentalData.worldbuilding}
                onChange={(data: any) => setExperimentalData(prev => ({ ...prev, worldbuilding: data }))}
                preview={showPreview}
              />
            )}
            
            {currentMode === 'branching-story' && (
              <BranchingStoryModeSimple
                data={experimentalData.branchingStory}
                onChange={(data: any) => setExperimentalData(prev => ({ ...prev, branchingStory: data }))}
                preview={showPreview}
              />
            )}

            {currentMode === 'normal' && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <BeakerIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Normal writing mode. Use the rich text editor above to write your content.</p>
              </div>
            )}

            {currentMode === 'placeholder' && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <PlusIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Future Experimental Mode</h3>
                <p>This slot is reserved for future experimental storytelling features.</p>
                <p className="mt-2 text-sm">Ideas: Poetry Mode, Audio Mode, Collaboration Mode</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('chapters')}
                    className={`px-3 py-1 text-sm rounded ${activeTab === 'chapters' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                  >
                    <Bars3Icon className="w-4 h-4 inline mr-1" />
                    Chapters
                  </button>
                  <button
                    onClick={() => setActiveTab('glossary')}
                    className={`px-3 py-1 text-sm rounded ${activeTab === 'glossary' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                  >
                    <SparklesIcon className="w-4 h-4 inline mr-1" />
                    Glossary
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-3 py-1 text-sm rounded ${activeTab === 'settings' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                  >
                    Settings
                  </button>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'chapters' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">Chapters</h3>
                    <button 
                      onClick={handleAddChapter}
                      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                  {chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className={`p-3 rounded-lg border cursor-pointer ${
                        currentChapter.id === chapter.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => handleSelectChapter(chapter)}
                    >
                      <div className="font-medium text-sm">{chapter.title || `Chapter ${chapter.number}`}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {chapter.wordCount} words • {chapter.status}
                      </div>
                    </div>
                  ))}
                  {chapters.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Bars3Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No chapters yet. Start writing to create your first chapter!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'glossary' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">Glossary</h3>
                    <button 
                      onClick={() => setShowGlossaryModal(true)}
                      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                  {glossaryEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="font-medium text-sm">{entry.term}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {entry.definition}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Ch. {entry.chapterIntroduced}
                      </div>
                    </div>
                  ))}
                  {glossaryEntries.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <SparklesIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No glossary entries yet. Select text and click &quot;Define&quot; to add terms!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Mode
                    </label>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {modes.find(m => m.id === currentMode)?.name} - {modes.find(m => m.id === currentMode)?.description}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Font Family
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {fontFamilies.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Statistics
                    </label>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div>Total Chapters: {chapters.length}</div>
                      <div>Total Words: {chapters.reduce((sum, ch) => sum + ch.wordCount, 0)}</div>
                      <div>Glossary Terms: {glossaryEntries.length}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating sidebar toggle when closed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed right-4 top-1/2 -translate-y-1/2 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 z-40"
          >
            <Bars3Icon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Glossary Modal */}
      {showGlossaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Add Glossary Entry</h3>
              <button
                onClick={() => setShowGlossaryModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Term
                </label>
                <input
                  type="text"
                  value={currentGlossaryEntry.term}
                  onChange={(e) => setCurrentGlossaryEntry(prev => ({ ...prev, term: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter the term..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Definition
                </label>
                <textarea
                  value={currentGlossaryEntry.definition}
                  onChange={(e) => setCurrentGlossaryEntry(prev => ({ ...prev, definition: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter the definition..."
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGlossaryModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGlossaryEntry}
                disabled={!currentGlossaryEntry.term || !currentGlossaryEntry.definition}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
