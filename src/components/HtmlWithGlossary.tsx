"use client"

import React, { useState, useEffect } from 'react'
import { GlossaryEntry } from '@/types'
import { GlossaryTooltip } from './GlossarySystem'
import { sanitizeHtml } from '@/lib/sanitize'

interface HtmlWithGlossaryProps {
  html: string
  glossaryTerms?: GlossaryEntry[]
}

// Escape regex special characters in a string
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Replace text nodes with React nodes wrapping glossary terms with GlossaryTooltip
export default function HtmlWithGlossary({ html, glossaryTerms = [] }: HtmlWithGlossaryProps) {
  const [mounted, setMounted] = useState(false)

  // Only render with glossary highlighting after mounting (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR or before mount, render raw HTML (no glossary highlighting)
  if (!mounted || !glossaryTerms || glossaryTerms.length === 0) {
    return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
  }

  // Sort terms by length desc to avoid partial matches
  const sorted = [...glossaryTerms].sort((a, b) => b.term.length - a.term.length)

  // Build regex that matches any term with word boundaries, case-insensitive
  const termPatterns = sorted.map(t => escapeRegExp(t.term))
  if (termPatterns.length === 0) return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />

  const globalRegex = new RegExp(`\\b(${termPatterns.join('|')})\\b`, 'gi')

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
        // find glossary entry (case-insensitive match)
        const entry = sorted.find(e => e.term.toLowerCase() === term.toLowerCase())
        if (entry) {
          parts.push(
            <GlossaryTooltip key={`${keyPrefix}-${parts.length}-${term}`} term={entry.term} definition={entry.definition}>
              {term}
            </GlossaryTooltip>
          )
        } else {
          parts.push(term)
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
      
      // Fix for React error #137: Spread children array instead of passing it as a single argument
      // Previously: createElement(Tag, props, children) would pass [] as an object child, causing error
      // Now: createElement(Tag, props, ...children) spreads the array correctly
      // For void elements with no children, we can skip passing children entirely for better semantics
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

  return <div>{nodes}</div>
}
