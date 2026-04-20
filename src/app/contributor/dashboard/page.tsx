import AppLayout from '@/components/AppLayout';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database/PrismaService';
import Link from 'next/link';

export default async function ContributorDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isContributor: true },
  });

  if (!user?.isContributor) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto py-10 text-center">
          <h1 className="text-3xl font-bold mb-4">Contributor Hub Offline</h1>
          <p className="text-gray-500 mb-6">
            You must enable the Contributor Hub from your reader settings to access this page.
          </p>
          <Link href="/reader/settings" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Go to Settings
          </Link>
        </div>
      </AppLayout>
    );
  }

  const profile = await prisma.contributorProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Contributor Dashboard</h1>
            <p className="text-gray-500">Track your translations, fan-art, and reputation.</p>
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-xl shadow-lg border border-white/10 flex items-center gap-4 text-white">
            <div className="bg-white/20 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-100">Reputation Score</p>
              <p className="text-2xl font-bold">{profile?.reputationScore || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Recent Translations
            </h2>
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-gray-500 mb-2">No translation submissions yet.</p>
              <Link href="/contributor/translations" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Start a translation →
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Recent Fan Art
            </h2>
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-gray-500 mb-2">No fan art uploaded yet.</p>
              <Link href="/contributor/fanart" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Submit Fan Art →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
