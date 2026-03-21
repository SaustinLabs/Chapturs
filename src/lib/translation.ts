import { prisma } from '@/lib/database/PrismaService'

// Target languages for translation (can be configured)
export const TARGET_LANGUAGES = ['es', 'fr', 'de', 'ja', 'zh']

// Default translation tiers for auto-generated content
export const AUTO_TRANSLATION_TIER = 'TIER_1_OFFICIAL'

// Simple in-memory cache for AI translations
const aiTranslationCache = new Map<string, { translatedText: string; timestamp: number }>()

// Cache duration (1 hour)
const CACHE_DURATION_MS = 60 * 60 * 1000

// Fake AI translation function - replace with real LLM call later
async function generateAITranslation(originalText: string, targetLang: string): Promise<string> {
  // Check cache first
  const cacheKey = `${originalText}:${targetLang}`
  const cached = aiTranslationCache.get(cacheKey)
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_MS) {
    return cached.translatedText
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // For now, just return a placeholder with language tag
  // In production, this would call OpenRouter or another LLM service
  const translatedText = `[${targetLang.toUpperCase()}] ${originalText}`
  
  // Cache the result
  aiTranslationCache.set(cacheKey, {
    translatedText,
    timestamp: Date.now()
  })
  
  return translatedText
}

/**
 * Translates a given text into multiple target languages
 * @param originalText The text to translate
 * @param targetLangs Array of language codes to translate to
 * @returns Promise resolving to map of languageCode -> translatedText
 */
export async function translateText(
  originalText: string, 
  targetLangs: string[] = TARGET_LANGUAGES
): Promise<Record<string, string>> {
  if (!originalText.trim()) {
    // Return empty translations for empty text
    return Object.fromEntries(targetLangs.map(lang => [lang, '']))
  }

  const translations: Record<string, string> = {}
  
  // Translate to each target language
  for (const lang of targetLangs) {
    try {
      translations[lang] = await generateAITranslation(originalText, lang)
    } catch (error) {
      console.error(`Failed to translate to ${lang}:`, error)
      // Provide fallback translation
      translations[lang] = `[${lang.toUpperCase()}] ${originalText}`
    }
  }
  
  return translations
}

/**
 * Persists AI-generated translations for a work's description field
 * @param workId The ID of the work
 * @param originalDescription The original description text
 * @param targetLangs Optional array of languages to translate to (defaults to TARGET_LANGUAGES)
 */
export async function persistDescriptionTranslations(
  workId: string, 
  originalDescription: string,
  targetLangs: string[] = TARGET_LANGUAGES
): Promise<void> {
  try {
    const translations = await translateText(originalDescription, targetLangs)
    
    // Create or update DescriptionTranslation records for each language
    for (const [languageCode, translatedDescription] of Object.entries(translations)) {
      // Check if translation already exists
      const existing = await prisma.descriptionTranslation.findFirst({
        where: {
          workId,
          languageCode
        }
      })
      
      if (existing) {
        // Update existing translation
        await prisma.descriptionTranslation.update({
          where: { id: existing.id },
          data: {
            translatedDescription,
            // Mark as AI-generated (could add a field for translation source/method)
            // For now we'll rely on the fact that AI translations are created via this function
            updatedAt: new Date()
          }
        })
      } else {
        // Create new AI-generated translation
        await prisma.descriptionTranslation.create({
          data: {
            workId,
            languageCode,
            translatedDescription,
            // Status active by default
            // Could add translationSource field to distinguish AI vs fan translations
          }
        })
      }
    }
  } catch (error) {
    console.error('Failed to persist description translations:', error)
    // Don't throw - we don't want translation failures to block work creation
  }
}

/**
 * Gets the translated description for a work in a specific language
 * Falls back to original description if translation not available
 * @param workId The ID of the work
 * @param languageCode Target language code
 * @param originalDescription Original description as fallback
 * @returns The translated description or original if not available
 */
export async function getTranslatedDescription(
  workId: string,
  languageCode: string,
  originalDescription: string
): Promise<string> {
  // If requesting original language, return original
  if (languageCode === 'en') { // Assuming English is default/original
    return originalDescription
  }
  
  try {
    const translation = await prisma.descriptionTranslation.findFirst({
      where: {
        workId,
        languageCode,
        status: 'active'
      }
    })
    
    if (translation) {
      return translation.translatedDescription
    }
    
    // Fallback to original if no translation found
    return originalDescription
  } catch (error) {
    console.error('Error fetching translated description:', error)
    return originalDescription // Fallback to original on error
  }
}