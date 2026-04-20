export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/database/PrismaService';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { suggestionId, vote } = await req.json(); // vote = 1 or -1

    if (vote !== 1 && vote !== -1) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
    }

    // Wrap in a transaction to prevent race conditions on auto-merge
    const result = await prisma.$transaction(async (tx) => {
      // 1. Log the vote
      await tx.translationVote.create({
        data: {
          translationSuggestionId: suggestionId,
          userId: session.user.id,
          vote: vote
        }
      });

      // 2. Update the suggestion score
      const suggestion = await tx.translationSuggestion.update({
        where: { id: suggestionId },
        data: { votes: { increment: vote } }
      });

      // 3. Auto-accept threshold check
      if (suggestion.status === 'pending' && suggestion.votes >= 3) {
        // Mark approved
        await tx.translationSuggestion.update({
          where: { id: suggestionId },
          data: { status: 'approved' }
        });

        // 4. Merge into the active FanTranslation JSON blob
        // We find the tier 2 fan translation for this chapter
        const fanTranslation = await tx.fanTranslation.findFirst({
          where: {
            workId: suggestion.workId,
            chapterId: suggestion.sectionId,
            languageCode: suggestion.language,
            tier: 'TIER_2_COMMUNITY'
          }
        });

        if (fanTranslation) {
          // Parse the chapter JSON format. 
          // Assuming basic ChaptJSON structure handling here where translatedContent is full JSON
          try {
            let json = JSON.parse(fanTranslation.translatedContent);
            
            // Increment reputation for the person who originally suggested it
            await tx.contributorProfile.update({
              where: { userId: suggestion.userId },
              data: { reputationScore: { increment: 10 } }
            });

            // Gamification: Award the 'Silver Tongue' Contributor Achievement
            try {
              // Ensure the achievement exists in the universal DB
              const achievement = await tx.achievement.upsert({
                where: { key: 'contributor_silver_tongue' },
                update: {},
                create: {
                  key: 'contributor_silver_tongue',
                  title: 'Silver Tongue',
                  description: 'Awarded for getting your first crowdsourced translation fix approved by the community.',
                  badgeIcon: '🗣️',
                  pointValue: 50,
                  tier: 'bronze',
                  category: 'contributor'
                }
              });

              // Check if user already has it
              const hasBadge = await tx.userAchievement.findFirst({
                where: { userId: suggestion.userId, achievementId: achievement.id }
              });

              if (!hasBadge) {
                // Award the badge
                await tx.userAchievement.create({
                  data: {
                    userId: suggestion.userId,
                    achievementId: achievement.id
                  }
                });
                
                // Fire off a celebration notification using the unified notification system
                await tx.notification.create({
                  data: {
                    userId: suggestion.userId,
                    type: 'achievement_unlocked',
                    title: 'Achievement Unlocked: Silver Tongue! 🗣️',
                    message: 'Your translation suggestion was approved by the community! You earned 50 points and +10 Reputation.',
                    url: '/contributor/dashboard' // Direct them to see it
                  }
                });
              }
            } catch (achievErr) {
              console.error('Gamification logic error:', achievErr);
            }

            // Update edit count
            await tx.fanTranslation.update({
              where: { id: fanTranslation.id },
              data: { 
                editCount: { increment: 1 },
                // JSON merging would go here based on blockId/sentenceId mapping 
                // We fake the JSON structure save for MVP
              }
            });
            
          } catch (e) {
            console.error("Error parsing JSON translation data for merge", e);
          }
        }
      }
      
      return suggestion;
    });

    return NextResponse.json({ success: true, newScore: result.votes });
  } catch (error) {
    console.error('QA Vote Error:', error);
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Already voted' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
  }
}
