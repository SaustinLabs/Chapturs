'use client'

import { useEffect, useState } from 'react'
import { Eye, Layers, Zap, Clock } from 'lucide-react'

interface SiteStats {
  pageviews: number
  linesOfCode: number
  featuresShipped: number
  hoursBuilding: number
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return n.toLocaleString()
}

interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
  sublabel?: string
  live?: boolean
}

function StatCard({ icon, value, label, sublabel, live }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/60 border border-gray-200 min-w-[120px] flex-1">
      <div className="flex items-center gap-1.5 text-blue-600 mb-0.5">
        {icon}
        {live && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            live
          </span>
        )}
      </div>
      <span className="text-2xl font-bold text-gray-900 tabular-nums">{value}</span>
      <span className="text-xs font-semibold text-gray-700 text-center">{label}</span>
      {sublabel && <span className="text-xs text-gray-400 text-center">{sublabel}</span>}
    </div>
  )
}

export default function BuildingInPublicStats() {
  const [stats, setStats] = useState<SiteStats | null>(null)

  useEffect(() => {
    // Fire-and-forget: count this page view
    fetch('/api/analytics/pageview', { method: 'POST' }).catch(() => {})

    // Fetch current stats
    fetch('/api/analytics/site-stats')
      .then((r) => r.json())
      .then((data: SiteStats) => setStats(data))
      .catch(() => {})
  }, [])

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-10">
      <div className="text-center mb-4">
        <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-1">
          Building in Public
        </p>
        <p className="text-gray-600 text-sm max-w-md mx-auto">
          We&apos;re early and growing — here&apos;s a live look at where we are right now.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <StatCard
          icon={<Eye className="w-4 h-4" />}
          value={stats ? formatNumber(stats.pageviews) : '—'}
          label="Page Views"
          sublabel="across the whole site"
          live
        />
        <StatCard
          icon={<Layers className="w-4 h-4" />}
          value={stats ? formatNumber(stats.linesOfCode) + '+' : '—'}
          label="Lines of Code"
          sublabel="TypeScript / React"
        />
        <StatCard
          icon={<Zap className="w-4 h-4" />}
          value={stats ? String(stats.featuresShipped) : '—'}
          label="Features Shipped"
          sublabel="and counting"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          value={stats ? formatNumber(stats.hoursBuilding) + '+' : '—'}
          label="Hours Building"
          sublabel="(approx)"
        />
      </div>
    </div>
  )
}
