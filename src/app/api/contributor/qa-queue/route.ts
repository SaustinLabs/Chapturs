export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/database/PrismaService';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isContributor: true, preferredLanguage: true }
    });

    if (!user?.isContributor) {
      return NextResponse.json({ error: 'Forbidden. Not a contributor.' }, { status: 403 });
    }

    // Only fetch suggestions matching the user's preferred language (or fallback to an active queue)
    const targetLanguage = user.preferredLanguage || 'en';

    // We get translation suggestions that are 'pending'
    const pendingSuggestionsRaw = await prisma.translationSuggestion.findMany({
      where: {
        status: 'pending',
        language: targetLanguage,
        userId: { not: session.user.id }
      },
      orderBy: { votes: 'desc' }
    });
    
    // Fetch user votes
    const userVotes = await prisma.translationVote.findMany({
      where: {
        userId: session.user.id,
        translationSuggestionId: { in: pendingSuggestionsRaw.map(s => s.id) }
      }
    });
    const votedIds = new Set(userVotes.map(v => v.translationSuggestionId));
    
    const pendingSuggestions = pendingSuggestionsRaw.filter(s => !votedIds.has(s.id)).slice(0, 10);

    return NextResponse.json({ suggestions: pendingSuggestions });
  } catch (error) {
    console.error('QA Queue Error:', error);
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }
}
