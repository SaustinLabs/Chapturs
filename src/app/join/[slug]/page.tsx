import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/database/PrismaService'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function JoinPage({ params }: Props) {
  const { slug } = await params

  const link = await prisma.communityLink.findUnique({ where: { slug } }).catch(() => null)

  if (!link || !link.active) {
    notFound()
  }

  const genres: string[] = link.genres ? JSON.parse(link.genres) : []

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <span className="text-3xl font-black text-white tracking-tight">Chapturs</span>
          <p className="text-gray-500 text-sm mt-1">Where stories live.</p>
        </div>

        {/* Welcome card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-4">
              Community Invite
            </span>
            <h1 className="text-2xl font-black text-white leading-tight mb-2">
              Welcome,{' '}
              <span className="text-blue-400">{link.label}</span>
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              You've been invited to Chapturs — a modern platform for serialised stories. 
              Your feed will be pre-tuned to your community's tastes from day one.
            </p>
          </div>

          {/* Genre pills */}
          {genres.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Your content Mix</p>
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs font-bold px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-full"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* What you get */}
          <div className="mb-8 space-y-2.5">
            {[
              'Infinite scroll feed tuned to your genres',
              'Glossary & character cards per story',
              'Chapter reactions and comments',
              'Bookmark anything, read anywhere',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-gray-400">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </div>
            ))}
          </div>

          {/* CTA — routes through API to set the cookie then land on /  */}
          <a
            href={`/api/join/${slug}`}
            className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-colors text-sm tracking-wide"
          >
            Start Reading →
          </a>

          <p className="text-center text-xs text-gray-600 mt-4">
            No account required to browse.{' '}
            <Link href="/" className="text-gray-500 hover:text-gray-400 underline">
              Skip to site
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const link = await prisma.communityLink.findUnique({ where: { slug } }).catch(() => null)
  return {
    title: link ? `${link.label} — Join Chapturs` : 'Join Chapturs',
    description: 'A modern platform for serialised stories.',
  }
}
