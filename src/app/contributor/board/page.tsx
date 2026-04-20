import AppLayout from '@/components/AppLayout';
import { prisma } from '@/lib/database/PrismaService';
import Link from 'next/link';

export default async function TranslationBountyBoardPage() {
  // Find official works that have allowCrowdsourcedTranslations: true
  // and have FanTranslations with low quality scores.
  const badTranslations = await prisma.fanTranslation.findMany({
    where: {
      qualityOverall: { lt: 3.0 },
      ratingCount: { gte: 1 }, // In real app might be 5, sticking to 1 for MVP testing
      work: {
        status: 'published',
        allowCrowdsourcedTranslations: true
      }
    },
    include: {
      work: true,
      chapter: true
    },
    take: 20
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <span className="text-4xl text-yellow-500">🏆</span>
            Translation Bounty Board
          </h1>
          <p className="text-gray-500 max-w-2xl">
            These published stories have translations that readers flagged as hard to understand.
            Help authors out by submitting suggestions or taking over the translation!
          </p>
        </div>

        {badTranslations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="text-2xl font-bold mb-2">Queue is Empty!</h2>
            <p className="text-gray-500">
              All tracked translations are currently rated highly by the community. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badTranslations.map(trans => (
              <div key={trans.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="p-5 flex-1 border-b border-gray-100 dark:border-gray-700/50">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      Needs Help
                    </span>
                    <span className="text-sm font-semibold text-gray-500 border border-gray-200 dark:border-gray-700 px-2 rounded">
                      {trans.languageCode.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">
                    {trans.work.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
                    Chapter: {trans.chapter.title || `Chapter ${trans.chapter.order}`}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full" 
                        style={{ width: `${(trans.qualityOverall / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {trans.qualityOverall.toFixed(1)}/5
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 text-right">Based on {trans.ratingCount} reviews</p>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                  <Link 
                    href={`/contributor/translations/editor/${trans.workId}/${trans.chapterId}`}
                    className="block w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg transition-colors"
                  >
                    Suggest Edits →
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
