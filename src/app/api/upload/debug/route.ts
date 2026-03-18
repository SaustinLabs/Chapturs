export const runtime = 'edge'

// Debug endpoint to test R2 connection and CORS
// Visit /api/upload/debug to see diagnostic information

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { r2Client, getR2PublicUrl } from '@/lib/r2'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Endpoint disabled' }, { status: 503 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? '✅ Set' : '❌ Missing',
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
        R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || '❌ Not set',
        R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || '❌ Not set',
      },
      r2Connection: 'Testing...',
      bucketAccess: 'Testing...',
      publicUrl: getR2PublicUrl(),
    }

    // Test R2 connection by listing objects
    try {
      const command = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME!,
        MaxKeys: 1,
      })
      
      await r2Client.send(command)
      diagnostics.r2Connection = '✅ Connected'
      diagnostics.bucketAccess = '✅ Can access bucket'
    } catch (error: any) {
      diagnostics.r2Connection = '❌ Failed'
      diagnostics.bucketAccess = `❌ Error: ${error.message}`
      diagnostics.error = {
        name: error.name,
        message: error.message,
        code: error.$metadata?.httpStatusCode,
      }
    }

    // Generate a test presigned URL
    try {
      const { generatePresignedUploadUrl } = await import('@/lib/r2')
      const testKey = 'test/cors-test.txt'
      const testUrl = await generatePresignedUploadUrl(testKey, 'text/plain', 1024)
      
      diagnostics.presignedUrl = {
        status: '✅ Generated',
        sample: testUrl.substring(0, 100) + '...',
        expiresIn: '10 minutes',
      }

      // Parse URL to show endpoint
      const url = new URL(testUrl)
      diagnostics.r2Endpoint = url.origin
    } catch (error: any) {
      diagnostics.presignedUrl = {
        status: '❌ Failed',
        error: error.message,
      }
    }

    // CORS recommendations
    diagnostics.corsPolicy = {
      required: true,
      location: 'Cloudflare R2 Dashboard → Bucket Settings → CORS Policy',
      recommendedPolicy: {
        AllowedOrigins: ['*'], // For testing
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag', 'Content-Length'],
        MaxAgeSeconds: 3600,
      },
      note: 'Start with AllowedOrigins: ["*"] for testing, then restrict to specific domains',
    }

    return NextResponse.json(diagnostics, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
