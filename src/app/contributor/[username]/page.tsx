import AppLayout from '@/components/AppLayout';
import { prisma } from '@/lib/database/PrismaService';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { UserIcon } from '@heroicons/react/24/outline';

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ContributorPublicProfilePage({ params }: PageProps) {
  const resolvedParams = await params;
  const username = resolvedParams.username;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      contributorProfile: true,
      translationsSubmitted: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { work: true }
      },
      imageSubmissions: {
        where: { status: 'approved' },
        take: 6,
        orderBy: { createdAt: 'desc' },
      },
      userAchievements: {
        include: { achievement: true }
      }
    }
  });

  if (!user || (!user.isContributor && !user.contributorProfile)) {
    notFound();
  }

  const profile = user.contributorProfile;
  const languages: string[] = profile?.languages ? JSON.parse(profile.languages) : [];
  const activeAchievements = user.userAchievements.map(ua => ua.achievement);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-10">
        {/* Header Cover Area */}
        <div className="relative h-48 bg-gradient-to-r from-green-500 to-blue-500 rounded-t-2xl shadow-sm">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full border-4 border-white dark:border-gray-900 shadow-md flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white dark:bg-gray-900 border-x border-b border-gray-200 dark:border-gray-800 rounded-b-2xl p-8 pt-16 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {user.displayName || user.username}
                {user.verified && (
                  <span className="text-blue-500" title="Verified">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  </span>
                )}
              </h1>
              <p className="text-gray-500 font-medium">@{user.username}</p>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                ⭐ {profile?.reputationScore || 0} Reputation
              </span>
              <div className="flex gap-2">
                {activeAchievements.map((ach) => (
                  <span key={ach.id} title={ach.description} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-sm cursor-help hover:scale-105 transition-transform">
                    <span>{ach.badgeIcon}</span> {ach.title}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {languages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {languages.map(lang => (
                  <span key={lang} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-medium">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contributions Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Translations */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
              Recent Translations
            </h2>
            {user.translationsSubmitted.length === 0 ? (
              <div className="p-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center text-gray-500">
                No public translations yet.
              </div>
            ) : (
              <div className="space-y-3">
                {user.translationsSubmitted.map(trans => (
                  <Link href={`/story/${trans.workId}/chapter/${trans.sectionId}`} key={trans.id} className="block p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {trans.work?.title || 'Unknown Work'}
                        </h3>
                        <p className="text-sm text-gray-500">Translated to {trans.language}</p>
                      </div>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        {trans.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Fan Art */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Approved Fan Art
            </h2>
            {user.imageSubmissions.length === 0 ? (
              <div className="p-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center text-gray-500">
                No fan art published yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {user.imageSubmissions.map(art => (
                  <div key={art.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100">
                    <img src={art.imageUrl} alt="Fan Art" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
