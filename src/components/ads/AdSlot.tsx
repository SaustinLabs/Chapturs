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

function AdSlotInner({
  placement,
  maturityRating,
  adSlotId,
  className,
  children,
}: AdSlotProps) {
  const [loaded, setLoaded] = useState(false)
  const [adBlocked, setAdBlocked] = useState(false)

  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID
  const slotId = adSlotId || process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID

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
    return children ? <>{children}</> : null
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

export default function AdSlot(props: AdSlotProps) {
  return (
    <Suspense fallback={<AdSkeleton placement={props.placement} className={props.className} />}>
      <AdSlotInner {...props} />
    </Suspense>
  )
}

