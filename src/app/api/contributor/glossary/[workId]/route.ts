export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/database/PrismaService';

export async function GET(req: NextRequest, props: { params: Promise<{ workId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isContributor: true }
    });

    if (!user?.isContributor) {
      return NextResponse.json({ error: 'Forbidden. Not a contributor.' }, { status: 403 });
    }

    const { workId } = params;

    // Fetch Glossary entries for this work
    const glossary = await prisma.glossaryEntry.findMany({
      where: { workId },
      orderBy: { term: 'asc' }
    });

    return NextResponse.json({ success: true, glossary });
    
  } catch (error) {
    console.error('Glossary Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch glossary' }, { status: 500 });
  }
}
