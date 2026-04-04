"use client"

import React, { useState, useEffect } from 'react'
import { GlossaryEntry } from '@/types'
import { GlossaryTooltip } from './GlossarySystem'
import { CharacterTooltip } from './CharacterTooltip'
import CharacterProfileViewModal from './CharacterProfileViewModal'
import { sanitizeHtml } from '@/lib/sanitize'

interface Character {
  id: string
  name: string
  role?: string
  imageUrl?: string
  quickGlance?: string
  physicalDescription?: string
  aliases?: string[]
  [key: string]: any
}

interface HtmlWithHighlightsProps {
  html: string
  glossaryTerms?: GlossaryEntry[]
  characters?: Character[]
}

// Escape regex special characters in a string
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Replace text nodes with React nodes wrapping glossary terms and characters
export default function HtmlWithHighlights({ 
  html, 
  glossaryTerms = [], 
  characters = [] 
}: HtmlWithHighlightsProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)

  // Only render with highlighting after mounting (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR or before mount, render raw HTML (no highlighting)
  if (!mounted || ((!glossaryTerms || glossaryTerms.length === 0) && (!characters || characters.length === 0))) {
    return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
  }

  // Build character name patterns (including aliases)
  const characterPatterns: Array<{ pattern: string; character: Character }> = []
  characters.forEach(char => {
    characterPatterns.push({ pattern: char.name, character: char })
    if (char.aliases) {
      char.aliases.forEach(alias => {
        characterPatterns.push({ pattern: alias, character: char })
      })
    }
  })

  // Sort patterns by length desc to avoid partial matches
  const sortedGlossary = [...glossaryTerms].sort((a, b) => b.term.length - a.term.length)
  const sortedCharacters = [...characterPatterns].sort((a, b) => b.pattern.length - a.pattern.length)

  // Build combined regex that matches any term with word boundaries, case-insensitive
  const allPatterns = [
    ...sortedGlossary.map(t => escapeRegExp(t.term)),
    ...sortedCharacters.map(c => escapeRegExp(c.pattern))
  ]
  
  if (allPatterns.length === 0) return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />

  const globalRegex = new RegExp(`\\b(${allPatterns.join('|')})\\b`, 'gi')

  // Parse the HTML and walk nodes (client-side only)
  const parser = new DOMParser()
  if (!parser) return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />

  const doc = parser.parseFromString(html, 'text/html')

  function nodeToReact(node: ChildNode, keyPrefix = ''): React.ReactNode {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (!globalRegex.test(text)) return text

      const parts: React.ReactNode[] = []
      let lastIndex = 0
      text.replace(globalRegex, (match, p1, offset) => {
        const before = text.slice(lastIndex, offset)
        if (before) parts.push(before)

        const term = match
        
        // Check if it's a character (characters take priority)
        const charMatch = sortedCharacters.find(c => 
          c.pattern.toLowerCase() === term.toLowerCase()
        )
        
        if (charMatch) {
          parts.push(
            <CharacterTooltip 
              key={`${keyPrefix}-${parts.length}-char-${term}`}
              character={charMatch.character}
              onCharacterClick={(char) => setSelectedCharacter(char)}
            >
              {term}
            </CharacterTooltip>
          )
        } else {
          // Check if it's a glossary term
          const glossaryMatch = sortedGlossary.find(e => 
            e.term.toLowerCase() === term.toLowerCase()
          )
          
          if (glossaryMatch) {
            parts.push(
              <GlossaryTooltip 
                key={`${keyPrefix}-${parts.length}-gloss-${term}`} 
                term={glossaryMatch.term} 
                definition={glossaryMatch.definition}
              >
                {term}
              </GlossaryTooltip>
            )
          } else {
            parts.push(term)
          }
        }

        lastIndex = offset + match.length
        return match
      })

      const tail = text.slice(lastIndex)
      if (tail) parts.push(tail)

      return parts
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const children = Array.from(el.childNodes).map((child, i) => nodeToReact(child, `${keyPrefix}-${i}`))
      const Tag = el.tagName.toLowerCase() as any
      const props: any = {}
      // copy attributes that are safe/useful
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i]
        props[attr.name] = attr.value
      }
      
      // Handle void elements properly
      const voidElements = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']
      if (voidElements.includes(Tag) && children.length === 0) {
        return React.createElement(Tag, { ...props, key: `${keyPrefix}-${Math.random()}` })
      }
      
      return React.createElement(Tag, { ...props, key: `${keyPrefix}-${Math.random()}` }, ...children)
    }

    return null
  }

  const bodyChildren = Array.from(doc.body.childNodes)
  const nodes = bodyChildren.map((n, i) => nodeToReact(n, `root-${i}`))

  return (
    <>
      <div>{nodes}</div>
      {selectedCharacter && (
        <CharacterProfileViewModal
          character={selectedCharacter}
          isOpen={!!selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </>
  )
}
