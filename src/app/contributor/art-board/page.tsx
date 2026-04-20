import AppLayout from '@/components/AppLayout';
import { prisma } from '@/lib/database/PrismaService';
import Link from 'next/link';
import { UserIcon } from '@heroicons/react/24/outline';

export default async function ArtBountyBoardPage() {
  // Query 1: Find characters without images from published works that allow user submissions
  const charactersNeedingArtRaw = await prisma.$queryRaw`
    SELECT 
      cp.id, 
      cp.name, 
      cp."physicalDescription", 
      cp."workId",
      w.title as "workTitle"
    FROM character_profiles cp
    JOIN "Work" w ON cp."workId" = w.id
    WHERE cp."imageUrl" IS NULL 
      AND w.status = 'published'
      AND cp."allowUserSubmissions" = true
    LIMIT 20
  ` as any[];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <span className="text-4xl text-pink-500">🎨</span>
            Art Bounty Board
          </h1>
          <p className="text-gray-500 max-w-2xl">
            These characters were introduced by authors but don&apos;t have any official or fan-art visuals yet.
            Read their descriptions, spark your imagination, and submit the first illustration!
          </p>
        </div>

        {charactersNeedingArtRaw.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-2xl font-bold mb-2">No Active Bounties</h2>
            <p className="text-gray-500">
              All tracked characters currently have visual representations!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {charactersNeedingArtRaw.map((char: any) => (
              <div key={char.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group">
                <div className="p-5 flex-1 border-b border-gray-100 dark:border-gray-700/50">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 ring-4 ring-pink-50 dark:ring-pink-900/20 group-hover:scale-105 transition-transform">
                    <UserIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {char.name}
                  </h3>
                  <p className="text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-3">
                    From: {char.workTitle}
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <h4 className="text-xs font-bold text-gray-500 mb-1">PHYSICAL DESCRIPTION:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic line-clamp-4">
                      "{char.physicalDescription || 'No physical description provided yet. Interpret freely!'}"
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                  <Link 
                    href={`/contributor/fanart/new?workId=${char.workId}&characterId=${char.id}`}
                    className="block w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 border border-transparent rounded-lg transition-colors"
                  >
                    Submit Fan Art 🖌️
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
