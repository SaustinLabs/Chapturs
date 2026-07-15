'use client'

import { useSession, signIn } from 'next-auth/react'
import { useState } from 'react'
import { Check, Sparkles, DollarSign, Users, Zap, ArrowRight } from 'lucide-react'

interface Props {
  spotsTaken: number
  spotsRemaining: number
}

const featureTooltips: Record<string, string> = {
  'Revenue share': 'Creators earn 70% of all subscription and ad revenue for 12 months. No fees, no hosting costs.',
  'Serial chapter publishing': 'Publish chapters on your schedule. Readers get notified when new chapters drop.',
  'AI quality assessment': 'AI scores your writing across 6 dimensions — pacing, prose, character depth, and more.',
  'Built-in translations': 'Readers can translate your work into 20+ languages. Community voting surfaces the best versions.',
  'Co-author collaboration': 'Invite co-authors with role-based permissions. Chapter locking prevents edit conflicts.',
  'Smart paste from Google Docs': 'Paste from Google Docs or Word — formatting, italics, and paragraph structure are preserved.',
  'Achievement system': 'Earn badges and milestones as you publish. Readers unlock achievements for engagement.',
  'Cross-story promotion': 'Promote your other works inside ad slots within your own stories — free internal cross-promotion.',
  'Direct dev access': 'Talk directly to the developers. Feature requests and bug reports go to the team, not a ticket queue.',
  'Founding creator badge': 'A permanent badge on your profile and every story page. Readers know you helped build the platform.',
  'Free to publish': 'No upfront costs, no hosting fees. You keep all rights to your work.',
  'Built-in reader audience': 'Gutenberg classics and discovery features bring readers to the platform. Your work gets prime placement.',
  'No exclusivity lock-in': 'Publish anywhere else. Chapturs does not require exclusivity — unlike Kindle Unlimited.',
}

function TooltipRow({ feature, chapturs, rr, wattpad, kdp, patreon }: {
  feature: string; chapturs: string | boolean; rr: string | boolean
  wattpad: string | boolean; kdp: string | boolean; patreon: string | boolean
}) {
  const tooltip = featureTooltips[feature]
  const [showTooltip, setShowTooltip] = useState(false)

  const renderCell = (val: string | boolean) => {
    if (val === true) return <Check size={16} className="text-green-600 dark:text-green-400 mx-auto" />
    if (val === false) return <span className="text-gray-300 dark:text-gray-600">&mdash;</span>
    return <span className="font-medium text-indigo-600 dark:text-indigo-400">{val}</span>
  }

  return (
    <tr className="bg-white dark:bg-gray-900 group">
      <td className="p-4 text-gray-700 dark:text-gray-300 relative">
        {tooltip ? (
          <span
            className="cursor-help border-b border-dotted border-gray-400 dark:border-gray-500"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {feature}
            {showTooltip && (
              <span className="absolute left-4 bottom-full mb-2 w-64 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl z-10 pointer-events-none">
                {tooltip}
                <span className="absolute top-full left-6 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
              </span>
            )}
          </span>
        ) : (
          feature
        )}
      </td>
      <td className="p-4 text-center">{renderCell(chapturs)}</td>
      <td className="p-4 text-center">{renderCell(rr)}</td>
      <td className="p-4 text-center">{renderCell(wattpad)}</td>
      <td className="p-4 text-center">{renderCell(kdp)}</td>
      <td className="p-4 text-center">{renderCell(patreon)}</td>
    </tr>
  )
}

function GlossaryDemoRow({ chapturs, rr, wattpad, kdp, patreon }: {
  chapturs: boolean; rr: boolean; wattpad: boolean; kdp: boolean; patreon: boolean
}) {
  const [showGlossary, setShowGlossary] = useState(false)
  const [showTooltips, setShowTooltips] = useState(false)

  const renderCell = (val: string | boolean) => {
    if (val === true) return <Check size={16} className="text-green-600 dark:text-green-400 mx-auto" />
    if (val === false) return <span className="text-gray-300 dark:text-gray-600">&mdash;</span>
    return <span className="text-gray-500">{val}</span>
  }

  return (
    <tr className="bg-white dark:bg-gray-900">
      <td className="p-4 text-gray-700 dark:text-gray-300 relative">
        <span
          className="cursor-help border-b border-dotted border-indigo-400 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400"
          onMouseEnter={() => setShowGlossary(true)}
          onMouseLeave={() => setShowGlossary(false)}
        >
          Glossary
          {showGlossary && (
            <span className="absolute left-4 bottom-full mb-2 w-56 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl z-10 pointer-events-none">
              Define terms, places, and lore. Readers see definitions on hover while reading your story.
              <span className="absolute top-full left-6 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
            </span>
          )}
        </span>
        {' + '}
        <span
          className="cursor-help border-b border-dotted border-indigo-400 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400"
          onMouseEnter={() => setShowTooltips(true)}
          onMouseLeave={() => setShowTooltips(false)}
        >
          tooltips
          {showTooltips && (
            <span className="absolute left-4 bottom-full mb-2 w-56 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl z-10 pointer-events-none">
              Character names, aliases, and profiles appear as hover tooltips — readers never lose track of who&apos;s who.
              <span className="absolute top-full left-6 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
            </span>
          )}
        </span>
      </td>
      <td className="p-4 text-center">{renderCell(chapturs)}</td>
      <td className="p-4 text-center">{renderCell(rr)}</td>
      <td className="p-4 text-center">{renderCell(wattpad)}</td>
      <td className="p-4 text-center">{renderCell(kdp)}</td>
      <td className="p-4 text-center">{renderCell(patreon)}</td>
    </tr>
  )
}

export default function FoundingCreatorsClient({ spotsTaken, spotsRemaining }: Props) {
  const { data: session } = useSession()

  const benefits = [
    {
      icon: DollarSign,
      title: '70% Revenue Share',
      desc: 'Keep 70% of all subscription and ad revenue from your works — for the first 12 months. No upfront fees, no hosting costs.',
    },
    {
      icon: Sparkles,
      title: 'Founding Creator Badge',
      desc: 'A permanent badge on your profile and every story page. Readers know you were here from the start.',
    },
    {
      icon: Users,
      title: 'Built-in Audience',
      desc: 'Gutenberg classics bring readers to the platform. Your original works get prime placement in discovery and recommendations.',
    },
    {
      icon: Zap,
      title: 'Direct Dev Access',
      desc: 'You talk directly to the builders. Feature requests, bug reports, feedback — all go straight to the team. No support tickets, no waiting.',
    },
  ]

  const features = [
    'AI-powered quality assessment that scores your writing across 6 dimensions',
    'Translation system supporting 20+ languages with community voting',
    'Glossary and character profile system with hover tooltips in the reader',
    'Collaborative editing with co-authors, role-based permissions, and chapter locking',
    'Series and volume grouping with one-click series subscription',
    'Smart paste from Google Docs or Word — your formatting survives',
    'Achievement system with reader engagement badges and milestone tracking',
    'Internal story promotion — cross-promote your works across ad slots',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6">
            <Sparkles size={14} />
            Founding Creators Program
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Be one of the first 100 authors on Chapturs
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            We&apos;re building a creator-first webnovel platform. No ads cluttering your chapters.
            No algorithms burying your work. Just readers, writers, and the tools to connect them.
          </p>

          {/* Spots counter */}
          <div className="inline-flex flex-col items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{spotsRemaining}</span>
              <span className="text-gray-500 dark:text-gray-400">spots remaining</span>
            </div>
            <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${spotsTaken}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{spotsTaken} / 100 claimed</span>
          </div>

          <div className="flex gap-4 justify-center">
            {session?.user ? (
              <a
                href="/creator/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Go to Creator Dashboard
                <ArrowRight size={16} />
              </a>
            ) : (
              <button
                onClick={() => signIn('google', { callbackUrl: '/creator/dashboard' })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Sign In & Start Publishing
                <ArrowRight size={16} />
              </button>
            )}
            <a
              href="#benefits"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div id="benefits" className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          What Founding Creators Get
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                <b.icon size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{b.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Features */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Tools You Won&apos;t Find Anywhere Else
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {features.map((f) => (
            <div key={f} className="flex items-start gap-3 p-4">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={12} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          How We Compare
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">Feature</th>
                <th className="text-center p-4 font-semibold text-indigo-600 dark:text-indigo-400">Chapturs</th>
                <th className="text-center p-4 font-medium text-gray-500">Royal Road</th>
                <th className="text-center p-4 font-medium text-gray-500">Wattpad</th>
                <th className="text-center p-4 font-medium text-gray-500">KDP</th>
                <th className="text-center p-4 font-medium text-gray-500">Patreon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <TooltipRow feature="Revenue share" chapturs="70%" rr="Ad share only" wattpad="Limited" kdp="35-70%" patreon="varies" />
              <TooltipRow feature="Serial chapter publishing" chapturs={true} rr={true} wattpad={true} kdp={false} patreon={false} />
              <TooltipRow feature="AI quality assessment" chapturs={true} rr={false} wattpad={false} kdp={false} patreon={false} />
              <TooltipRow feature="Built-in translations" chapturs={true} rr={false} wattpad={false} kdp={false} patreon={false} />
              {/* Self-demonstrating row: Glossary and tooltips are actual tooltips */}
              <GlossaryDemoRow chapturs={true} rr={false} wattpad={false} kdp={false} patreon={false} />
              <TooltipRow feature="Co-author collaboration" chapturs={true} rr={false} wattpad="Limited" kdp={false} patreon={false} />
              <TooltipRow feature="Smart paste from Google Docs" chapturs={true} rr={false} wattpad={false} kdp={false} patreon={false} />
              <TooltipRow feature="Achievement system" chapturs={true} rr="Limited" wattpad="Limited" kdp={false} patreon={false} />
              <TooltipRow feature="Cross-story promotion" chapturs={true} rr={false} wattpad={false} kdp={false} patreon={false} />
              <TooltipRow feature="Direct dev access" chapturs={true} rr={false} wattpad={false} kdp={false} patreon={false} />
              <TooltipRow feature="Founding creator badge" chapturs={true} rr={false} wattpad={false} kdp={false} patreon={false} />
              <TooltipRow feature="Free to publish" chapturs={true} rr={true} wattpad={true} kdp={true} patreon={true} />
              <TooltipRow feature="Built-in reader audience" chapturs={true} rr={true} wattpad={true} kdp={false} patreon={false} />
              <TooltipRow feature="No exclusivity lock-in" chapturs={true} rr={true} wattpad="Limited" kdp="KU lock-in" patreon={true} />
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center max-w-2xl mx-auto">
          KDP = Amazon Kindle Direct Publishing. KU = Kindle Unlimited (requires exclusivity).
          Patreon is a tipping/membership model, not a publishing platform &mdash; included as a revenue comparison.
        </p>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to build something?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
          The first 100 authors who publish a chapter get the Founding Creator badge — permanently.
          After that, it&apos;s gone forever.
        </p>
        {session?.user ? (
          <a
            href="/creator/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
          >
            Start Publishing
            <ArrowRight size={20} />
          </a>
        ) : (
          <button
            onClick={() => signIn('google', { callbackUrl: '/creator/dashboard' })}
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
          >
            Sign In & Claim Your Spot
            <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
