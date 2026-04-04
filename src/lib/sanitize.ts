/**
 * HTML Sanitization Utility
 *
 * Sanitizes user-generated HTML before rendering via dangerouslySetInnerHTML.
 * - Server/SSR: strips the most dangerous patterns with conservative regexes.
 * - Client: uses DOMPurify for thorough, allowlist-based sanitization.
 *
 * Call this on EVERY value passed to dangerouslySetInnerHTML.__html.
 */

const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'del', 'ins', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'a', 'code', 'pre',
]

const ALLOWED_ATTR = ['class', 'href', 'target', 'rel']

/**
 * Sanitize an HTML string to prevent XSS.
 * Safe to call in both server and client environments.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''

  if (typeof window === 'undefined') {
    // Server/SSR: strip the most dangerous patterns conservatively.
    // Client components will re-sanitize with DOMPurify after hydration.
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^>]*>/gi, '')
      .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
      .replace(/javascript\s*:/gi, 'blocked:')
  }

  // Client: use DOMPurify for thorough sanitization
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require('dompurify') as typeof import('dompurify').default
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: true,
  })
}
