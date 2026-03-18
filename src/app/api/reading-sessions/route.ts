export const runtime = 'nodejs'

/**
 * Reading Sessions API Endpoint
 * 
 * Tracks comprehensive reading behavior data for recommendation system
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  generateRequestId,
  checkRateLimit,
  addCorsHeaders,
  ApiError,
  ApiErrorType
} from '@/lib/api/errorHandling'
import { z } from 'zod'
import SignalTracker from '@/lib/recommendations/SignalTracker'

// Reading session validation schema
const readingSessionSchema = z.object({
  userId: z.string(),
  workId: z.string(),
  sectionId: z.string().optional(),
  startTime: z.string().transform(str => new Date(str)),
  endTime: z.string().transform(str => new Date(str)),
  scrollDepth: z.number().min(0).max(1),
  wordsRead: z.number().min(0),
  totalWords: z.number().min(1),
  interactions: z.array(z.string()),
  deviceType: z.enum(['mobile', 'desktop', 'tablet']),
  referrer: z.string().optional(),
  duration: z.number().optional() // seconds
})

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous'
    checkRateLimit(`reading_sessions_${clientId}`, 60, 60000) // 60 sessions per minute
    
    // Authentication required
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError('Authentication required for reading session tracking', 401, ApiErrorType.AUTHENTICATION_ERROR)
    }
    
    const body = await request.json()
    const readingSession = readingSessionSchema.parse(body)
    
    // Verify user owns this session
    if (readingSession.userId !== session.user.id) {
      throw new ApiError('Cannot track reading sessions for other users', 403, ApiErrorType.AUTHORIZATION_ERROR)
    }
    
    // Track the comprehensive reading session
    await SignalTracker.trackReadingSession({
      userId: readingSession.userId,
      workId: readingSession.workId,
      sectionId: readingSession.sectionId,
      startTime: readingSession.startTime,
      endTime: readingSession.endTime,
      scrollDepth: readingSession.scrollDepth,
      wordsRead: readingSession.wordsRead,
      totalWords: readingSession.totalWords,
      interactions: readingSession.interactions,
      deviceType: readingSession.deviceType,
      referrer: readingSession.referrer
    })
    
    const response = createSuccessResponse({
      message: 'Reading session tracked successfully',
      sessionDuration: readingSession.duration || Math.round((readingSession.endTime.getTime() - readingSession.startTime.getTime()) / 1000),
      completionRate: readingSession.wordsRead / readingSession.totalWords,
      timestamp: new Date().toISOString()
    }, 'Reading session processed', requestId)
    
    return addCorsHeaders(response)
    
  } catch (error) {
    return createErrorResponse(error, requestId)
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}