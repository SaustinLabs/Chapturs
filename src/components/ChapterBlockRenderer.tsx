'use client'

import React from 'react'
import HtmlWithGlossary from './HtmlWithGlossary'
import HtmlWithHighlights from './HtmlWithHighlights'
import MobileTextBox from './MobileTextBox'
import { sanitizeHtml } from '@/lib/sanitize'

interface ContentBlock {
  id: string
  type: 'prose' | 'heading' | 'dialogue' | 'narration' | 'chat' | 'phone' | 'text' | 'promoted_story'
  [key: string]: any
}

interface ChapterBlockRendererProps {
  content: ContentBlock[]
  className?: string
}

export default function ChapterBlockRenderer({ content, className = '' }: ChapterBlockRendererProps) {
  if (!Array.isArray(content) || content.length === 0) {
    return null
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {content.map((block, index) => (
        <div key={block.id || index} data-block-id={block.id || `block-${index}`}>
          <BlockRenderer block={block} />
        </div>
      ))}
    </div>
  )
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'prose':
      return <ProseBlock content={block.text || block.content || ''} />
    
    case 'text':
      // Plain text block from editor
      return <ProseBlock content={block.content || block.text || ''} />
    
    case 'heading':
      return <HeadingBlock text={block.text} level={block.level} />
    
    case 'dialogue':
      return <DialogueBlock lines={block.lines} />
    
    case 'narration':
      return <NarrationBlock text={block.text} />
    
    case 'chat':
      return <ChatBlock messages={block.messages} />
    
    case 'phone':
      return <PhoneBlock screens={block.screens} />
    
    case 'promoted_story':
      return <PromotedStoryCard workId={block.workId} blurb={block.blurb} />
    
    default:
      console.warn('Unknown block type:', block.type, block)
      return null
  }
}

// Prose Block - Regular text content with HTML formatting
function ProseBlock({ content }: { content: string }) {
  const [glossaryTerms, setGlossaryTerms] = React.useState<any[] | undefined>(undefined)
  const [characters, setCharacters] = React.useState<any[] | undefined>(undefined)

  // Only access window globals after mounting to avoid hydration mismatch
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if ((window as any).__CURRENT_GLOSSARY_TERMS__) {
          setGlossaryTerms((window as any).__CURRENT_GLOSSARY_TERMS__)
        }
        if ((window as any).__CURRENT_CHARACTERS__) {
          setCharacters((window as any).__CURRENT_CHARACTERS__)
        }
      }
    } catch (e) {
      // ignore
    }
  }, [])

  return (
    <div className="prose-content leading-relaxed">
      <HtmlWithHighlights 
        html={content} 
        glossaryTerms={glossaryTerms} 
        characters={characters}
      />
    </div>
  )
}

// Heading Block - Chapter/section headings
function HeadingBlock({ text, level = 2 }: { text: string; level?: number }) {
  const sizeClasses: { [key: number]: string } = {
    1: 'text-4xl',
    2: 'text-3xl',
    3: 'text-2xl',
    4: 'text-xl',
    5: 'text-lg',
    6: 'text-base'
  }
  
  const normalizedLevel = Math.min(Math.max(level, 1), 6)
  const className = `font-bold text-center my-8 ${sizeClasses[normalizedLevel]}`
  
  switch (normalizedLevel) {
    case 1: return <h1 className={className}>{text}</h1>
    case 2: return <h2 className={className}>{text}</h2>
    case 3: return <h3 className={className}>{text}</h3>
    case 4: return <h4 className={className}>{text}</h4>
    case 5: return <h5 className={className}>{text}</h5>
    case 6: return <h6 className={className}>{text}</h6>
    default: return <h2 className={className}>{text}</h2>
  }
}

// Dialogue Block - Conversation with speaker labels
function DialogueBlock({ lines }: { lines: Array<{ speaker: string; text: string }> }) {
  if (!lines || lines.length === 0) return null
  
  return (
    <div className="space-y-3 my-6">
      {lines.map((line, index) => (
        <div key={index} className="flex gap-3">
          <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0">
            {line.speaker}:
          </span>
          <span 
            className="text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: `"${sanitizeHtml(line.text)}"` }}
          />
        </div>
      ))}
    </div>
  )
}

// Narration Block - Italicized narrative text
function NarrationBlock({ text }: { text: string }) {
  return (
    <div 
      className="italic text-center text-gray-600 dark:text-gray-400 my-6"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
    />
  )
}

// Chat Block - Modern messaging interface with mobile optimization
function ChatBlock({ messages }: { messages: Array<{ sender: string; text: string; timestamp?: string }> }) {
  if (!messages || messages.length === 0) return null
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 my-6 space-y-3 max-w-2xl mx-auto">
      {messages.map((message, index) => (
        <div key={index} className="flex flex-col">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-sm text-blue-600 dark:text-blue-400">
              {message.sender}
            </span>
            {message.timestamp && (
              <span className="text-xs text-gray-400">
                {message.timestamp}
              </span>
            )}
          </div>
          {/* Use MobileTextBox for better mobile rendering with Pretext */}
          <MobileTextBox
            content={message.text}
            platform="generic"
            fontSize={14}
            fontFamily="Inter"
            lineHeight={20}
            maxWidth={250}
            className="my-1"
            showTimestamps={false}
          />
        </div>
      ))}
    </div>
  )
}

// Phone Block - Mobile UI mockup
function PhoneBlock({ screens }: { screens: Array<{ type: string; content: any }> }) {
  if (!screens || screens.length === 0) return null
  
  return (
    <div className="flex justify-center my-8">
      <div className="w-[375px] bg-gray-900 rounded-[3rem] p-4 shadow-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] h-[667px] overflow-auto">
          {screens.map((screen, index) => (
            <div key={index} className="p-4">
              {screen.type === 'message' && (
                <div className="space-y-2">
                  {screen.content.messages?.map((msg: any, i: number) => (
                    <div key={i} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`rounded-2xl px-4 py-2 max-w-[70%] ${
                          msg.sent 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }`}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.text) }}
                      />
                    </div>
                  ))}
                </div>
              )}
              {screen.type === 'app' && (
                <div className="text-center py-8">
                  <div className="text-2xl font-bold mb-2">{screen.content.title}</div>
                  <div 
                    className="text-gray-600 dark:text-gray-400"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(screen.content.description) }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Promoted Story Card — inline promotion block in chapter reader
function PromotedStoryCard({ workId, blurb }: { workId: string; blurb: string }) {
  const [work, setWork] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!workId) { setLoading(false); return }
    fetch(`/api/works/${workId}`)
      .then(r => r.json())
      .then(data => { setWork(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [workId])

  if (loading) {
    return (
      <div className="my-6 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
      </div>
    )
  }

  if (!work) return null

  const coverUrl = work.coverImage
  const href = `/story/${workId}`

  return (
    <div className="my-6 not-prose">
      <div className="border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent">
        <div className="flex items-start gap-4">
          {coverUrl ? (
            <img src={coverUrl} alt={work.title} className="w-12 h-18 rounded object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-18 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
              <span className="text-gray-400 text-xs">📖</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
              Story Recommendation
            </p>
            <a href={href} className="font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {work.title}
            </a>
            {work.authorProfile?.user?.displayName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                by {work.authorProfile.user.displayName}
              </p>
            )}
            {blurb && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic leading-relaxed">
                {blurb}
              </p>
            )}
            <a
              href={href}
              className="inline-block mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              Read {work.title} →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
