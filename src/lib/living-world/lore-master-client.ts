import OpenAI from 'openai'

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://chapturs.com',
    'X-Title': 'Chapturs',
  },
})

const LORE_MASTER_MODEL = 'meta-llama/llama-3.3-70b-instruct'
const MAX_TOKENS = 1024

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoreMasterContext {
  worldTitle: string
  theBeginning?: string | null
  theEnd?: string | null
  canonSummary: string // pre-formatted string of canon facts
}

export interface LoreMasterQueryResult {
  answer: string
  confidence: 'high' | 'medium' | 'low' | 'uncertain'
  relevantFacts: string[]
}

export interface ContradictionScanResult {
  hasContradictions: boolean
  flags: Array<{
    description: string
    severity: 'minor' | 'major' | 'critical'
    relatedFacts: string[]
  }>
}

// ── Query mode: answer a writer's question about the lore ─────────────────────

export async function queryLore(
  context: LoreMasterContext,
  question: string,
): Promise<LoreMasterQueryResult> {
  const systemPrompt = `You are the Lore Master for the fictional universe "${context.worldTitle}".
You have deep knowledge of this world's canon and help writers stay consistent.

${context.theBeginning ? `THE BEGINNING: ${context.theBeginning}` : ''}
${context.theEnd ? `THE END: ${context.theEnd}` : ''}

ESTABLISHED CANON:
${context.canonSummary || '(No canon entries yet)'}

Answer the writer's question about this universe. Be precise and cite which canon facts informed your answer.
If a question cannot be answered from established canon, say so clearly.
Respond in JSON: { "answer": "...", "confidence": "high|medium|low|uncertain", "relevantFacts": ["fact1", ...] }`

  const completion = await openrouter.chat.completions.create({
    model: LORE_MASTER_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  try {
    const parsed = JSON.parse(raw) as Partial<LoreMasterQueryResult>
    return {
      answer: parsed.answer ?? 'Unable to answer',
      confidence: parsed.confidence ?? 'uncertain',
      relevantFacts: parsed.relevantFacts ?? [],
    }
  } catch {
    return { answer: raw, confidence: 'uncertain', relevantFacts: [] }
  }
}

// ── Scan mode: detect contradictions in a body of text ───────────────────────

export async function scanForContradictions(
  context: LoreMasterContext,
  newText: string,
): Promise<ContradictionScanResult> {
  const systemPrompt = `You are the Lore Master for the fictional universe "${context.worldTitle}".
Analyse a new piece of writing for contradictions against established canon.

${context.theBeginning ? `THE BEGINNING: ${context.theBeginning}` : ''}
${context.theEnd ? `THE END: ${context.theEnd}` : ''}

ESTABLISHED CANON:
${context.canonSummary || '(No canon entries yet)'}

Identify any statements in the new text that contradict established canon.
Ignore stylistic differences — flag only factual conflicts.
Respond in JSON: { "hasContradictions": true|false, "flags": [{ "description": "...", "severity": "minor|major|critical", "relatedFacts": ["..."] }] }`

  const completion = await openrouter.chat.completions.create({
    model: LORE_MASTER_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `New text to scan:\n\n${newText}` },
    ],
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  try {
    const parsed = JSON.parse(raw) as Partial<ContradictionScanResult>
    return {
      hasContradictions: parsed.hasContradictions ?? false,
      flags: parsed.flags ?? [],
    }
  } catch {
    return { hasContradictions: false, flags: [] }
  }
}

// ── Build a canon summary string from entry objects ───────────────────────────

export function buildCanonSummary(
  entries: Array<{ entryType: string; title: string; content: string; status: string }>,
  maxEntries = 40,
): string {
  const active = entries.filter((e) => e.status === 'canon' || e.status === 'proposed')
  const truncated = active.slice(0, maxEntries)
  return truncated
    .map((e) => `[${e.entryType.toUpperCase()}] ${e.title}: ${e.content}`)
    .join('\n')
}
