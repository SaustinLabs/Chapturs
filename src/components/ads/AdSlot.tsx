'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Script from 'next/script'
import { shouldShowAdsense } from '@/lib/ads/ad-eligibility'

interface AdSlotProps {
  placement: 'sidebar' | 'inline' | 'interstitial' | 'video-support'
  maturityRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'
  adSlotId?: string
  className?: string
  children?: React.ReactNode
  workId?: string  // current work ID — enables internal promo displacement
}

function AdSkeleton({
  placement,
  className,
}: {
  placement: AdSlotProps['placement']
  className?: string
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded ${className || ''}`}
      style={{ minHeight: placement === 'sidebar' ? '250px' : '90px' }}
      aria-hidden="true"
    />
  )
}

function AdBlockPlaceholder({
  placement,
  className,
}: {
  placement: AdSlotProps['placement']
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 text-center ${className || ''}`}
      style={{ minHeight: placement === 'sidebar' ? '250px' : '90px' }}
    >
      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
        Ads on Chapturs go directly to authors — 70% of every impression
      </p>
      <p className="text-xs text-amber-700 dark:text-amber-400">
        Consider whitelisting us to support the writers you love
      </p>
    </div>
  )
}

function AdComingSoon({
  placement,
  className,
}: {
  placement: AdSlotProps['placement']
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-4 text-center ${className || ''}`}
      style={{ minHeight: placement === 'sidebar' ? '250px' : '90px' }}
    >
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        Ad space reserved
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Ads will support creators directly — 70% revenue share
      </p>
    </div>
  )
}

function AdSlotInner({
  placement,
  maturityRating,
  adSlotId,
  className,
  children,
  workId,
}: AdSlotProps) {
  const [loaded, setLoaded] = useState(false)
  const [adBlocked, setAdBlocked] = useState(false)
  const [promo, setPromo] = useState<{ promotedWorkId: string; promotedBlurb: string } | null | 'loading'>('loading')

  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID
  const slotId = adSlotId || process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID

  // Check for work-level internal promotion
  useEffect(() => {
    if (!workId) { setPromo(null); return }
    fetch(`/api/works/${workId}/promotion`)
      .then(r => r.json())
      .then(data => {
        if (data.promotedWorkId) {
          // 30% chance to displace the ad with the internal promo
          setPromo(Math.random() < 0.3 ? data : null)
        } else {
          setPromo(null)
        }
      })
      .catch(() => setPromo(null))
  }, [workId])

  useEffect(() => {
    if (!loaded || !pubId) return
    try {
      // @ts-ignore - adsbygoogle is injected by Google script
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // push() threw — adsbygoogle object is present but ads are suppressed
      setAdBlocked(true)
    }
  }, [loaded, pubId])

  if (!shouldShowAdsense(maturityRating)) {
    return <>{children}</> || null
  }

  if (adBlocked) {
    return <AdBlockPlaceholder placement={placement} className={className} />
  }

  if (!pubId || !slotId) {
    // If there's a work-level promo, show it instead of the coming-soon placeholder
    if (promo && promo !== 'loading' && promo.promotedWorkId) {
      return <PromotedAdCard workId={promo.promotedWorkId} blurb={promo.promotedBlurb} placement={placement} className={className} />
    }
    return <AdComingSoon placement={placement} className={className} />
  }

  // Internal promo displaces real ad 30% of the time
  if (promo && promo !== 'loading' && promo.promotedWorkId) {
    return <PromotedAdCard workId={promo.promotedWorkId} blurb={promo.promotedBlurb} placement={placement} className={className} />
  }

  return (
    <div className={`ad-slot ad-slot--${placement} ${className || ''}`}>
      <Script
        id="adsbygoogle-init"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`}
        crossOrigin="anonymous"
        strategy="lazyOnload"
        onLoad={() => setLoaded(true)}
        onError={() => setAdBlocked(true)}
      />
      {loaded ? (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={pubId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <AdSkeleton placement={placement} className={className} />
      )}
    </div>
  )
}

// Promoted Ad Card — displaces an ad slot with an internal work promotion
function PromotedAdCard({
  workId,
  blurb,
  placement,
  className,
}: {
  workId: string
  blurb: string
  placement: string
  className?: string
}) {
  const [work, setWork] = React.useState<any>(null)

  React.useEffect(() => {
    fetch(`/api/works/${workId}`)
      .then(r => r.json())
      .then(setWork)
      .catch(() => {})
  }, [workId])

  const minHeight = placement === 'sidebar' ? '250px' : '90px'

  if (!work) {
    return <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded ${className || ''}`} style={{ minHeight }} />
  }

  const href = `/story/${workId}`

  return (
    <div
      className={`border border-indigo-200 dark:border-indigo-700 rounded-lg bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-gray-900 p-4 flex flex-col justify-center ${className || ''}`}
      style={{ minHeight }}
    >
      <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-2">
        📢 {work.authorProfile?.user?.displayName || 'Author'} recommends
      </p>
      <a href={href} className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1">
        {work.title}
      </a>
      {blurb && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic line-clamp-2">
          {blurb}
        </p>
      )}
      <a
        href={href}
        className="inline-block mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
      >
        Read now →
      </a>
    </div>
  )
}

export default function AdSlot(props: AdSlotProps) {
  return (
    <Suspense fallback={<AdSkeleton placement={props.placement} className={props.className} />}>
      <AdSlotInner {...props} />
    </Suspense>
  )
}

