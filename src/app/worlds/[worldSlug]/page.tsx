import { notFound } from 'next/navigation'
import { prisma } from '@/lib/database/PrismaService'
import WorldAtlas from '@/components/living-world/WorldAtlas'
import LoreIndex from '@/components/living-world/LoreIndex'
import TimelineView from '@/components/living-world/TimelineView'

interface Props {
  params: Promise<{ worldSlug: string }>
}

export default async function WorldPage({ params }: Props) {
  const { worldSlug } = await params

  const world = await prisma.livingWorld.findUnique({
    where: { slug: worldSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      theBeginning: true,
      theEnd: true,
      coverImage: true,
      status: true,
      founderId: true,
      createdAt: true,
      founder: { select: { id: true, username: true, displayName: true, avatar: true } },
      _count: { select: { works: true, canonEntries: true, characters: true, councilMembers: true } },
    },
  })

  if (!world || world.status === 'archived') {
    notFound()
  }

  // Load canon entries for the lore index + timeline
  const canonEntries = await prisma.canonEntry.findMany({
    where: { worldId: world.id, status: { in: ['canon', 'proposed'] } },
    select: {
      id: true,
      entryType: true,
      title: true,
      content: true,
      status: true,
      createdAt: true,
      sourceWork: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })

  // Load works in this world
  const works = await prisma.work.findMany({
    where: { livingWorldId: world.id, status: { not: 'draft' } },
    select: {
      id: true,
      title: true,
      description: true,
      coverImage: true,
      status: true,
      genres: true,
      author: {
        select: {
          id: true,
          userId: true,
          user: { select: { username: true, displayName: true, avatar: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  // Load canon characters
  const characters = await prisma.canonCharacter.findMany({
    where: { worldId: world.id, status: { not: 'unknown' } },
    orderBy: { name: 'asc' },
    take: 100,
  })

  return (
    <div className="min-h-screen bg-gray-950">
      {/* World header */}
      <div
        className="relative"
        style={
          world.coverImage
            ? { background: `linear-gradient(to bottom, transparent 60%, #030712), url(${world.coverImage}) center/cover` }
            : { background: 'linear-gradient(to bottom, #1e1b4b, #030712)' }
        }
      >
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
            Living World
          </p>
          <h1 className="text-4xl font-bold text-white mb-4">{world.title}</h1>
          {world.description && (
            <p className="text-lg text-gray-300 max-w-2xl leading-relaxed">{world.description}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-400">
            <span>{world._count.works} stories</span>
            <span>·</span>
            <span>{world._count.canonEntries} canon entries</span>
            <span>·</span>
            <span>{world._count.characters} characters</span>
            <span>·</span>
            <span>Founded by {world.founder.displayName ?? world.founder.username}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-16">
        {/* Stories in this world */}
        <WorldAtlas world={{ id: world.id, title: world.title }} works={works} />

        {/* Lore Index */}
        <LoreIndex
          worldId={world.id}
          canonEntries={canonEntries.map((e: typeof canonEntries[number]) => ({
            id: e.id,
            entryType: e.entryType,
            title: e.title,
            content: e.content,
            status: e.status,
            sourceWork: e.sourceWork,
          }))}
          characters={characters.map((c: typeof characters[number]) => ({
            id: c.id,
            name: c.name,
            aliases: c.aliases,
            description: c.description,
            traits: c.traits,
            status: c.status,
          }))}
        />

        {/* Timeline */}
        <TimelineView
          entries={canonEntries
            .filter((e: typeof canonEntries[number]) => e.entryType === 'event')
            .map((e: typeof canonEntries[number]) => ({
              id: e.id,
              title: e.title,
              content: e.content,
              status: e.status,
              createdAt: e.createdAt.toISOString(),
              sourceWork: e.sourceWork,
            }))}
        />

        {/* Canon Beginning & End */}
        {(world.theBeginning || world.theEnd) && (
          <section>
            <h2 className="text-xl font-bold text-white mb-6">The Canon</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {world.theBeginning && (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 mb-3">
                    The Beginning
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{world.theBeginning}</p>
                </div>
              )}
              {world.theEnd && (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-400 mb-3">
                    The End
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{world.theEnd}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { worldSlug } = await params
  const world = await prisma.livingWorld.findUnique({
    where: { slug: worldSlug },
    select: { title: true, description: true },
  })
  if (!world) return {}
  return {
    title: world.title,
    description: world.description ?? `Explore the ${world.title} universe on Chapturs`,
    openGraph: { title: world.title, description: world.description ?? '' },
  }
}
