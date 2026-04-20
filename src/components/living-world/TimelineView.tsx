'use client'

interface TimelineEntry {
  id: string
  title: string
  content: string
  status: string
  createdAt: string
  sourceWork?: { id: string; title: string } | null
}

interface Props {
  entries: TimelineEntry[]
}

const STATUS_COLORS = {
  canon: 'border-indigo-500 bg-indigo-900/30',
  proposed: 'border-yellow-600 bg-yellow-900/20',
  disputed: 'border-orange-600 bg-orange-900/20',
  retconned: 'border-gray-700 bg-gray-900 opacity-50',
}

export default function TimelineView({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-bold text-white mb-4">Timeline</h2>
        <p className="text-gray-500 text-sm">No events have been added to the timeline yet.</p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-6">
        Timeline
        <span className="ml-2 text-sm font-normal text-gray-400">({entries.length} events)</span>
      </h2>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700" />

        <div className="space-y-6 pl-12">
          {entries.map((entry, idx) => (
            <div key={entry.id} className="relative">
              {/* Dot on the line */}
              <div
                className={`absolute -left-10 top-3 w-3 h-3 rounded-full border-2 ${
                  entry.status === 'canon'
                    ? 'border-indigo-400 bg-indigo-900'
                    : entry.status === 'proposed'
                    ? 'border-yellow-500 bg-yellow-900'
                    : 'border-gray-600 bg-gray-800'
                }`}
              />

              <div
                className={`rounded-xl border px-5 py-4 transition-colors ${
                  STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.proposed
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 font-mono">#{idx + 1}</span>
                      {entry.status === 'canon' && (
                        <span className="text-xs text-indigo-400 font-medium">Canon</span>
                      )}
                      {entry.status === 'proposed' && (
                        <span className="text-xs text-yellow-400 font-medium">Proposed</span>
                      )}
                      {entry.status === 'disputed' && (
                        <span className="text-xs text-orange-400 font-medium">Disputed</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-100 mb-2">{entry.title}</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{entry.content}</p>
                    {entry.sourceWork && (
                      <a
                        href={`/story/${entry.sourceWork.id}`}
                        className="mt-2 inline-block text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        First seen in: {entry.sourceWork.title} →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-600 text-center">
        Events are listed in the order they were added to canon, not necessarily chronological world order.
      </p>
    </section>
  )
}
