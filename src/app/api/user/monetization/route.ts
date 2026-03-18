export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import DatabaseService from '@/lib/database/PrismaService';

// Simple in-memory rate limiter (use Redis in production)
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// PATCH: Update ad support level or premium status
export async function PATCH(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { adSupportLevel, isPremium } = await req.json();
  
  // Validate input
  if (adSupportLevel && !['normal', 'boosted', 'video'].includes(adSupportLevel)) {
    return NextResponse.json({ error: 'Invalid ad support level' }, { status: 400 });
  }
  if (typeof isPremium !== 'undefined' && typeof isPremium !== 'boolean') {
    return NextResponse.json({ error: 'Invalid premium status' }, { status: 400 });
  }
  
  try {
    await DatabaseService.updateUserMonetization(session.user.id, adSupportLevel, isPremium);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating monetization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Get current user ad support and premium status
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const user = await DatabaseService.getUser(session.user.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ adSupportLevel: user.adSupportLevel, isPremium: user.isPremium });
  } catch (error) {
    console.error('Error fetching monetization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
