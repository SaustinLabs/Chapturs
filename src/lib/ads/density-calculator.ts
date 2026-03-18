const MIN_ADS = 1
const MAX_ADS = 5
const WORDS_PER_AD = 1000

export function calculateAdCount(wordCount: number): number {
  if (!Number.isFinite(wordCount) || wordCount <= 0) return MIN_ADS
  const rawCount = Math.ceil(wordCount / WORDS_PER_AD)
  return Math.max(MIN_ADS, Math.min(MAX_ADS, rawCount))
}

export function getSuggestedPlacements(
  wordCount: number,
  paragraphCount: number
): number[] {
  if (!Number.isFinite(paragraphCount) || paragraphCount <= 1) return []

  const maxPlacements = Math.max(0, paragraphCount - 1)
  const desiredCount = calculateAdCount(wordCount)
  const placementCount = Math.min(desiredCount, maxPlacements)
  if (placementCount <= 0) return []

  const placements: number[] = []

  for (let i = 1; i <= placementCount; i += 1) {
    const ratio = i / (placementCount + 1)
    let index = Math.round(ratio * paragraphCount)

    if (index < 1) index = 1
    if (index > paragraphCount - 1) index = paragraphCount - 1

    while (placements.includes(index) && index < paragraphCount - 1) {
      index += 1
    }

    if (!placements.includes(index)) {
      placements.push(index)
    }
  }

  return placements.sort((a, b) => a - b)
}
