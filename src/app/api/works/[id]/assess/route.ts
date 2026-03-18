export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/errorHandling'
import Groq from 'groq-sdk'

// Initialize Groq - ensure process.env.GROQ_API_KEY is set in production
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key' })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workId } = await params
    const { sectionId } = await req.json()

    if (!sectionId) {
      return NextResponse.json({ error: 'Missing sectionId' }, { status: 400 })
    }

    // Verify ownership
    const work = await prisma.work.findUnique({ where: { id: workId } })
    if (!work || work.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to assess this work' }, { status: 403 })
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId }
    })

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Attempt to extract text from content (assuming JSON DraftJS or block format)
    let textToAnalyze = ''
    try {
      const content = JSON.parse(section.content)
      // basic extraction: if format has blocks
      if (Array.isArray(content.blocks)) {
        textToAnalyze = content.blocks.map((b: any) => b.text || b.content || '').join('\n')
      } else {
        textToAnalyze = section.content.substring(0, 5000) // fallback raw
      }
    } catch {
      textToAnalyze = section.content.substring(0, 5000)
    }

    if (!textToAnalyze.trim()) {
      return NextResponse.json({ error: 'No text found to analyze' }, { status: 400 })
    }

    // Truncate to reasonable length for processing
    textToAnalyze = textToAnalyze.substring(0, 4000)

    // Send to GROQ
    const prompt = `Analyze the following story excerpt and provide a JSON response evaluating it.
Return ONLY valid JSON matching this schema:
{
  "writingQuality": <number 0-100>,
  "storytelling": <number 0-100>,
  "characterization": <number 0-100>,
  "worldBuilding": <number 0-100>,
  "engagement": <number 0-100>,
  "originality": <number 0-100>,
  "overallScore": <number 0-100>,
  "qualityTier": "<exceptional | strong | developing | needs_work>",
  "discoveryTags": ["<tag1>", "<tag2>"],
  "feedbackMessage": "<Short constructive paragraph>"
}

Excerpt:
${textToAnalyze}
`

    let groqResponse
    let parseResult
    
    // Check if we actually have an API key. If not, use mock data to prevent crashes during dev.
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy_key') {
      parseResult = {
        writingQuality: 85,
        storytelling: 80,
        characterization: 75,
        worldBuilding: 90,
        engagement: 85,
        originality: 88,
        overallScore: 84,
        qualityTier: "strong",
        discoveryTags: ["Fantasy", "Adventure"],
        feedbackMessage: "Great pacing and world-building! Consider adding more dialogue to flesh out the characters."
      }
    } else {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.3,
        response_format: { type: "json_object" }
      })

      groqResponse = completion.choices[0]?.message?.content || '{}'
      parseResult = JSON.parse(groqResponse)
    }

    // Upsert the Quality Assessment
    const assessment = await prisma.qualityAssessment.upsert({
      where: {
        workId_sectionId: {
          workId,
          sectionId
        }
      },
      update: {
        overallScore: parseResult.overallScore,
        writingQuality: parseResult.writingQuality,
        storytelling: parseResult.storytelling,
        characterization: parseResult.characterization,
        worldBuilding: parseResult.worldBuilding,
        engagement: parseResult.engagement,
        originality: parseResult.originality,
        qualityTier: parseResult.qualityTier,
        discoveryTags: JSON.stringify(parseResult.discoveryTags),
        feedbackMessage: parseResult.feedbackMessage,
        model: 'llama3-8b-8192',
        version: '1.0'
      },
      create: {
        workId,
        sectionId,
        overallScore: parseResult.overallScore,
        writingQuality: parseResult.writingQuality,
        storytelling: parseResult.storytelling,
        characterization: parseResult.characterization,
        worldBuilding: parseResult.worldBuilding,
        engagement: parseResult.engagement,
        originality: parseResult.originality,
        qualityTier: parseResult.qualityTier,
        discoveryTags: JSON.stringify(parseResult.discoveryTags),
        feedbackMessage: parseResult.feedbackMessage,
        model: 'llama3-8b-8192',
        version: '1.0'
      }
    })

    return createSuccessResponse({ assessment }, 'Quality Assessment generated successfully')
  } catch (error) {
    console.error('[Quality Assessment API Error]:', error)
    return createErrorResponse(error, 'quality-assessment')
  }
}
