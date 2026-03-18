export const runtime = 'edge'

/**
 * Signal Tracking API Endpoint
 * 
 * Receives and processes user behavior signals for recommendation system
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
import SignalTracker, { SignalType } from '@/lib/recommendations/SignalTracker'

// Signal validation schema
const signalSchema = z.object({
  userId: z.string(),
  workId: z.string().optional(),
  authorId: z.string().optional(),
  signalType: z.nativeEnum(SignalType),
  value: z.number().min(-1).max(1),
  metadata: z.record(z.string(), z.any()).optional(),
  sessionId: z.string().optional(),
  timestamp: z.string().transform(str => new Date(str))
})

const batchSignalSchema = z.object({
  signals: z.array(signalSchema)
})

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    // Rate limiting - more permissive for signals since they're frequent
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous'
    checkRateLimit(`signals_${clientId}`, 200, 60000) // 200 signals per minute
    
    // Authentication required for signal tracking
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError('Authentication required for signal tracking', 401, ApiErrorType.AUTHENTICATION_ERROR)
    }
    
    const body = await request.json()
    
    // Check if single signal or batch
    let signals
    if (body.signals) {
      // Batch signals
      const { signals: signalData } = batchSignalSchema.parse(body)
      signals = signalData
    } else {
      // Single signal
      const signal = signalSchema.parse(body)
      signals = [signal]
    }
    
    // Verify user owns these signals
    const unauthorizedSignals = signals.filter(s => s.userId !== session.user.id)
    if (unauthorizedSignals.length > 0) {
      throw new ApiError('Cannot track signals for other users', 403, ApiErrorType.AUTHORIZATION_ERROR)
    }
    
    // Process signals
    if (signals.length === 1) {
      await SignalTracker.trackSignal(signals[0])
    } else {
      await SignalTracker.trackSignals(signals)
    }
    
    const response = createSuccessResponse({
      message: `Successfully tracked ${signals.length} signal(s)`,
      signalsProcessed: signals.length,
      timestamp: new Date().toISOString()
    }, `Processed ${signals.length} signals`, requestId)
    
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