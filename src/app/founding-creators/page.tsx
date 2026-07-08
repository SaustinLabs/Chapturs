export const runtime = 'nodejs'

import { prisma } from '@/lib/database/PrismaService'
import FoundingCreatorsClient from './FoundingCreatorsClient'

export const metadata = {
  title: 'Founding Creators Program — Chapturs',
  description: 'Join the first 100 authors on Chapturs. 70% revenue share, founding badge, and direct dev access.',
}

export default async function FoundingCreatorsPage() {
  // Count how many founding creator badges have been awarded
  const awarded = await prisma.userAchievement.count({
    where: { achievement: { key: 'founding_creator' } },
  }).catch(() => 0)

  const spotsRemaining = Math.max(0, 100 - awarded)
  const spotsTaken = awarded

  return <FoundingCreatorsClient spotsTaken={spotsTaken} spotsRemaining={spotsRemaining} />
}
