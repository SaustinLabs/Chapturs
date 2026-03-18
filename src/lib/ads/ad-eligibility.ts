import type { AdEligibility } from '@/types/ads'

export type ContentMaturityRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'

const AD_ELIGIBILITY_BY_RATING: Record<ContentMaturityRating, AdEligibility> = {
  G: 'full',
  PG: 'full',
  'PG-13': 'full',
  R: 'restricted',
  'NC-17': 'none'
}

export function getAdEligibility(
  maturityRating?: ContentMaturityRating | null
): AdEligibility {
  if (!maturityRating) return 'restricted'
  return AD_ELIGIBILITY_BY_RATING[maturityRating] ?? 'restricted'
}

export function shouldShowAdsense(
  maturityRating?: ContentMaturityRating | null
): boolean {
  return getAdEligibility(maturityRating) !== 'none'
}

export function getAdConfig(maturityRating?: ContentMaturityRating | null): {
  showSidebar: boolean
  showInline: boolean
  maxAds: number
} {
  const eligibility = getAdEligibility(maturityRating)

  switch (eligibility) {
    case 'full':
      return { showSidebar: true, showInline: true, maxAds: 5 }
    case 'restricted':
      return { showSidebar: true, showInline: true, maxAds: 3 }
    case 'none':
    default:
      return { showSidebar: false, showInline: false, maxAds: 0 }
  }
}
