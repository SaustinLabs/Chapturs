// Zod validation schemas for API endpoints
import { z } from 'zod'

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  bio: z.string().max(500, 'Bio too long').optional(),
  avatar: z.string().url('Invalid avatar URL').optional()
})

// Work schemas
export const createWorkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  formatType: z.enum(['novel', 'article', 'comic', 'hybrid'], {
    message: 'Format type must be one of: novel, article, comic, hybrid'
  }),
  coverImage: z.string().optional(),
  genres: z.array(z.string()).max(10, 'Maximum 10 genres allowed').default([]),
  tags: z.array(z.string()).max(20, 'Maximum 20 tags allowed').default([]),
  maturityRating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17']).default('PG'),
  status: z.enum(['draft', 'ongoing', 'completed', 'hiatus']).default('draft')
})

export const updateWorkSchema = createWorkSchema.partial()

// Section schemas  
export const createSectionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['draft', 'published', 'archived']).default('draft')
})

export const updateSectionSchema = createSectionSchema.partial()

// Bookmark schemas
export const toggleBookmarkSchema = z.object({
  workId: z.string().min(1, 'Work ID is required'),
  shelf: z.enum(['reading', 'want_to_read', 'on_hold', 'finished']).optional()
})

export const updateBookmarkShelfSchema = z.object({
  workId: z.string().min(1, 'Work ID is required'),
  shelf: z.enum(['reading', 'want_to_read', 'on_hold', 'finished'])
})

// Subscription schemas
export const toggleSubscriptionSchema = z.object({
  authorId: z.string().min(1, 'Author ID is required')
})

export const updateSubscriptionPreferencesSchema = z.object({
  authorId: z.string().min(1, 'Author ID is required'),
  notificationsEnabled: z.boolean()
})

// Like schemas
export const toggleLikeSchema = z.object({
  workId: z.string().min(1, 'Work ID is required')
})

// Glossary schemas
export const createGlossaryEntrySchema = z.object({
  term: z.string().min(1, 'Term is required').max(100, 'Term too long'),
  definition: z.string().min(1, 'Definition is required').max(2000, 'Definition too long')
})

// Character profile schemas
export const createCharacterProfileSchema = z.object({
  name: z.string().min(1, 'Character name is required').max(100, 'Character name too long'),
  aliases: z.array(z.string()).default([]),
  role: z.string().max(100, 'Role too long').optional(),
  firstAppearance: z.number().int().positive('First appearance must be positive').optional(),
  imageUrl: z.union([z.string().url('Invalid image URL'), z.literal('')]).optional(),
  quickGlance: z.string().max(500, 'Quick glance text too long').optional(),
  physicalDescription: z.string().max(5000, 'Physical description too long').optional(),
  age: z.string().max(50, 'Age too long').optional(),
  height: z.string().max(50, 'Height too long').optional(),
  appearanceNotes: z.string().max(5000, 'Appearance notes too long').optional(),
  backstory: z.string().max(10000, 'Backstory too long').optional(),
  personalityTraits: z.array(z.string()).default([]),
  motivations: z.string().max(5000, 'Motivations too long').optional(),
  characterArc: z.string().max(5000, 'Character arc too long').optional(),
  developmentTimeline: z.record(z.string(), z.any()).optional(),
  authorNotes: z.string().max(5000, 'Author notes too long').optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  categoryLabels: z.record(z.string(), z.string()).optional(),
  allowUserSubmissions: z.boolean().optional()
})

export const updateCharacterProfileSchema = createCharacterProfileSchema.partial().extend({
  name: z.string().min(1, 'Character name is required').max(100, 'Character name too long').optional()
})

// Comment schemas (for future use)
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
  parentId: z.string().optional() // For nested comments
})

// Search schemas
export const searchWorksSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  formatType: z.enum(['novel', 'article', 'comic', 'hybrid']).optional(),
  genres: z.array(z.string()).optional(),
  maturityRating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17']).optional(),
  status: z.enum(['draft', 'ongoing', 'completed', 'hiatus']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// URL parameter schemas
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID parameter is required')
})

export const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID parameter is required')  
})

export const workIdParamSchema = z.object({
  workId: z.string().min(1, 'Work ID parameter is required')
})

// Query parameter validation helpers
export function validateSearchParams(searchParams: URLSearchParams, schema: z.ZodSchema) {
  const params: Record<string, any> = {}
  
  for (const [key, value] of searchParams.entries()) {
    // Handle array parameters (e.g., genres[]=horror&genres[]=thriller)
    if (key.endsWith('[]')) {
      const baseKey = key.slice(0, -2)
      if (!params[baseKey]) params[baseKey] = []
      params[baseKey].push(value)
    }
    // Handle numeric parameters
    else if (['page', 'limit', 'offset'].includes(key)) {
      params[key] = parseInt(value, 10)
    }
    // Handle boolean parameters
    else if (['verified', 'featured'].includes(key)) {
      params[key] = value === 'true'
    }
    // Handle regular string parameters
    else {
      params[key] = value
    }
  }

  return schema.parse(params)
}