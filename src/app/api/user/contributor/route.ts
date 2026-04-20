export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/database/PrismaService';

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { isContributor } = await req.json();

    // Toggle the status
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { isContributor: Boolean(isContributor) }
    });
    
    // If they turned it on and don't have a profile yet, initialize one
    if (user.isContributor) {
      const existingProfile = await prisma.contributorProfile.findUnique({
        where: { userId: user.id }
      });
      
      if (!existingProfile) {
        await prisma.contributorProfile.create({
          data: {
            userId: user.id
          }
        });
      }
    }
    
    return NextResponse.json({ success: true, isContributor: user.isContributor });
  } catch (error) {
    console.error('Error updating contributor status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isContributor: true }
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ isContributor: user.isContributor });
  } catch (error) {
    console.error('Error fetching contributor status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
