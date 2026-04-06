// Supported translation target languages
export const SUPPORTED_LANGUAGES = ['es', 'fr', 'de', 'ja', 'zh', 'pt', 'ko', 'it', 'ru', 'ar']

const LANG_NAMES: Record<string, string> = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  zh: 'Chinese (Simplified)',
  pt: 'Portuguese',
  ko: 'Korean',
  it: 'Italian',
  ru: 'Russian',
  ar: 'Arabic',
}

// Short-lived process-level cache to avoid redundant LLM calls within a single deploy
const memCache = new Map<string, string>()

async function callTranslationLLM(systemPrompt: string, userContent: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://chapturs.com',
      'X-Title': 'Chapturs',
    },
    body: JSON.stringify({
      model: process.env.LLM_TRANSLATION_MODEL ?? 'meta-llama/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter translation error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

/**
 * Translate a single text string to a target language on demand.
 * Returns the original text unchanged if targetLang is 'en' or text is empty.
 */
export async function translateOnDemand(text: string, targetLang: string): Promise<string> {
  if (!text.trim() || targetLang === 'en') return text

  const memKey = `${targetLang}:${text}`
  if (memCache.has(memKey)) return memCache.get(memKey)!

  const langName = LANG_NAMES[targetLang] ?? targetLang
  const translated = await callTranslationLLM(
    `You are a literary translator. Translate the following text into ${langName}. Preserve the tone, style, and formatting. Return only the translation — no commentary, no quotes, no explanations.`,
    text
  )

  memCache.set(memKey, translated)
  return translated
}

/**
 * Translate a batch of text strings in one LLM call (more efficient for multi-block content).
 * Non-text entries (empty strings) are passed through unchanged.
 * Returns an array of the same length as the input.
 */
export async function translateBatch(texts: string[], targetLang: string): Promise<string[]> {
  if (targetLang === 'en' || !texts.length) return texts

  // Only send non-empty strings to the LLM
  const toTranslate: Array<{ index: number; text: string }> = []
  texts.forEach((t, i) => {
    if (t.trim()) toTranslate.push({ index: i, text: t })
  })

  if (!toTranslate.length) return texts

  const langName = LANG_NAMES[targetLang] ?? targetLang
  const inputJson = JSON.stringify(toTranslate.map((t) => t.text))

  const raw = await callTranslationLLM(
    `You are a literary translator. Translate each string in the following JSON array into ${langName}. Preserve the tone, style, and formatting for each entry. Return ONLY a valid JSON array of the same length with translated strings — no commentary, no markdown, no extra text.`,
    inputJson
  )

  let translated: string[]
  try {
    // Strip any accidental markdown fences before parsing
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim()
    translated = JSON.parse(cleaned)
    if (!Array.isArray(translated) || translated.length !== toTranslate.length) {
      throw new Error('Unexpected response shape')
    }
  } catch (err) {
    console.error('translateBatch: failed to parse LLM response, falling back to originals', err)
    return texts
  }

  const result = [...texts]
  toTranslate.forEach(({ index }, i) => {
    result[index] = translated[i] ?? texts[index]
  })

  // Populate mem-cache for individual entries
  toTranslate.forEach(({ text }, i) => {
    memCache.set(`${targetLang}:${text}`, translated[i] ?? text)
  })

  return result
}

const CHUNK_SIZE = 50

/**
 * Translate a large array of text strings, automatically splitting into
 * chunks of up to CHUNK_SIZE blocks per LLM call to stay within context limits.
 * Chunks are processed sequentially (not parallel) to avoid hammering the API.
 * Returns an array of the same length as the input.
 */
export async function translateBatchChunked(texts: string[], targetLang: string): Promise<string[]> {
  if (targetLang === 'en' || !texts.length) return texts

  if (texts.length <= CHUNK_SIZE) {
    return translateBatch(texts, targetLang)
  }

  const result: string[] = []
  for (let i = 0; i < texts.length; i += CHUNK_SIZE) {
    const chunk = texts.slice(i, i + CHUNK_SIZE)
    const translated = await translateBatch(chunk, targetLang)
    result.push(...translated)
  }
  return result
}

/**
 * Stub — previously pre-generated and cached description translations.
 * That model was removed (task #84). Descriptions are now translated on-demand
 * when a reader requests a non-English view. This is a no-op kept for import
 * compatibility until callers can be cleaned up.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function persistDescriptionTranslations(_workId: string, _description: string): Promise<void> {
  // no-op
}
