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

function AdSkeleton({ className }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded ${className || ''}`}
      style={{ minHeight: placement === 'sidebar' ? '250px' : '90px' }}
      aria-hidden="true"
    />
  )
}

function AdSlotInner({ 
  placement, 
  maturityRating, 
  adSlotId,
  className,
  children 
}: AdSlotProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID
  const slotId = adSlotId || process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID

  useEffect(() => {
    if (!loaded || !pubId) return
    
    try {
      // @ts-ignore - adsbygoogle is injected by Google script
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.warn('AdSense push failed:', e)
      setError(true)
    }
  }, [loaded, pubId])

  // If content is explicit, don't show ads at all
  if (!shouldShowAdsense(maturityRating)) {
    return <>{children}</> || null
  }

  // If no publisher ID configured, show fallback
  if (!pubId || !slotId) {
    if (children) return <>{children}</>
    return null
  }

  // If ad failed to load, show fallback
  if (error) {
    return <>{children}</> || null
  }

  return (
    <div className={`ad-slot ad-slot--${placement} ${className || ''}`}>
      <Script
        id="adsbygoogle-init"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`}
        crossOrigin="anonymous"
        strategy="lazyOnload"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
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
        <AdSkeleton className={className} />
      )}
    </div>
  )
}

export default function AdSlot(props: AdSlotProps) {
  return (
    <Suspense fallback={<AdSkeleton className={props.className} />}>
      <AdSlotInner {...props} />
    </Suspense>
  )
}
