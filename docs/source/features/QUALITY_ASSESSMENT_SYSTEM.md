# Quality Assessment System

## Overview

An intelligent LLM-based quality assessment system that evaluates first chapters of stories to help good content get discovered. The system uses GPT-4o-mini for cost-efficient scoring, generates discovery tags, and provides constructive feedback to authors.

## Key Features

### 🎯 Smart Scoring
- **6 Scoring Dimensions** (0-100 each):
  - Writing Quality (25% weight)
  - Storytelling (20% weight)
  - Characterization (15% weight)
  - World-Building (15% weight)
  - Engagement (15% weight)
  - Originality (10% weight)

### 🏆 Quality Tiers & Boosts
- **Exceptional** (85+): 1.5x visibility boost for 30 days
- **Strong** (70-84): 1.2x visibility boost for 30 days
- **Developing** (50-69): 1.0x (normal visibility)
- **Needs Work** (<50): 0.8x (reduced visibility)

### 🔍 Discovery Tags
- AI generates 5-15 intelligent discovery tags per story
- Examples: `harry-potter-like`, `slow-burn-romance`, `found-family`, `lgbtq+`, `dark-academia`, `cozy-mystery`
- Tags help readers find stories they'll love
- Stored as hidden metadata for improved discoverability

### 💬 Constructive Feedback
- One-sentence feedback message
- Always constructive and encouraging
- Focused on strengths and growth opportunities
- Never harsh or discouraging

### 💰 Cost Efficient
- Uses GPT-4o-mini ($0.15 per 1M input tokens, $0.60 per 1M output tokens)
- Limited to 800 max tokens per assessment
- Estimated cost: ~$0.002-0.005 per assessment
- Full cost tracking via LLMUsageLog table

## Architecture

### Database Schema (Prisma)

7 new models:

1. **QualityAssessmentQueue** - Manages assessment queue with priority system
2. **QualityAssessment** - Stores assessment results
3. **QualityAssessmentHistory** - Tracks score changes over time
4. **AssessmentPromptTemplate** - Version-controlled prompts
5. **AssessmentFeedback** - User feedback on assessments
6. **LLMUsageLog** - Cost and usage tracking
7. **PromptTemplate** - Generic template storage

### Services

#### `src/lib/quality-assessment/llm-service.ts`
- OpenAI GPT-4o-mini integration
- Structured JSON output parsing
- Discovery tag generation
- Cost estimation and logging

#### `src/lib/quality-assessment/assessment-service.ts`
- Queue management (add, process, get status)
- Content extraction from .chapt format
- Score calculation and tier assignment
- Boost expiry management
- Batch processing support

#### `src/lib/quality-assessment/types.ts`
- TypeScript type definitions
- Interfaces for all assessment data structures

### API Routes

#### `POST /api/quality-assessment/queue`
Add a work to the assessment queue
```typescript
{
  "workId": "string",
  "sectionId": "string", 
  "priority": "high" | "normal" | "low" // optional, defaults to "normal"
}
```

#### `GET /api/quality-assessment/[workId]?sectionId=xyz`
Get assessment results for a work
```typescript
{
  "id": "string",
  "workId": "string",
  "sectionId": "string",
  "overallScore": 85,
  "qualityTier": "exceptional",
  "scores": {
    "writingQuality": 88,
    "storytelling": 85,
    // ...
  },
  "discoveryTags": ["harry-potter-like", "magic-academy"],
  "feedbackMessage": "Exceptional world-building with vivid descriptions.",
  "boostMultiplier": 1.5,
  "boostExpiry": "2025-11-11T...",
  "createdAt": "2025-10-12T..."
}
```

#### `POST /api/quality-assessment/process`
Manually trigger queue processing (for workers)
```typescript
{
  "count": 5 // optional, process up to 5 items (max 10)
}
```

#### `GET /api/quality-assessment/stats`
Get system statistics (for admin dashboards)
```typescript
{
  "queue": {
    "pending": 12,
    "processing": 2,
    "completed": 145,
    "failed": 3
  },
  "assessments": {
    "total": 145,
    "byTier": {
      "exceptional": 15,
      "strong": 45,
      "developing": 70,
      "needs_work": 15
    }
  },
  "costs": {
    "totalCost": 0.72,
    "totalCalls": 145
  }
}
```

### UI Components

#### `src/components/QualityCelebration.tsx`
Beautiful celebration UI that shows:
- Quality tier with custom colors/icons
- Overall score (large display)
- Breakdown of 6 scoring dimensions
- Discovery tags
- Constructive feedback message
- Visibility boost information
- Fireworks animation for exceptional/strong tiers

## Workflow

### 1. Publishing Flow Integration

When a user publishes their first chapter:

```typescript
// In your publish handler
const queueResponse = await fetch('/api/quality-assessment/queue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workId: work.id,
    sectionId: firstChapter.id,
    priority: 'normal'
  })
})
```

### 2. Background Processing

Set up a background worker (e.g., cron job, queue worker):

```typescript
// Every 5 minutes
const processResponse = await fetch('/api/quality-assessment/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ count: 10 })
})
```

### 3. Showing Results

Display assessment to user after publishing:

```tsx
import QualityCelebration from '@/components/QualityCelebration'

<QualityCelebration 
  workId={work.id}
  sectionId={firstChapter.id}
  onClose={() => router.push('/dashboard')}
/>
```

## Configuration

### Environment Variables Required

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Prompt Customization

Edit the prompt in `src/lib/quality-assessment/llm-service.ts`:

```typescript
const prompt = `You are a literary quality assessment AI...`
```

Or use the AssessmentPromptTemplate table for version-controlled prompts.

## Cost Management

### Estimated Costs
- **Input tokens**: ~2,000-3,000 per assessment (chapter content + prompt)
- **Output tokens**: ~200-400 per assessment (scores + tags + feedback)
- **Cost per assessment**: $0.002-0.005
- **1,000 assessments**: ~$2.50-5.00

### Monitoring
Track costs via:
```typescript
GET /api/quality-assessment/stats
```

Check `LLMUsageLog` table for detailed usage.

## Testing

### Manual Testing

1. **Add to queue**:
```bash
curl -X POST http://localhost:3000/api/quality-assessment/queue \
  -H "Content-Type: application/json" \
  -d '{"workId":"test123","sectionId":"chapter1"}'
```

2. **Process queue**:
```bash
curl -X POST http://localhost:3000/api/quality-assessment/process \
  -H "Content-Type: application/json" \
  -d '{"count":1}'
```

3. **Get results**:
```bash
curl http://localhost:3000/api/quality-assessment/test123?sectionId=chapter1
```

## Future Enhancements

- [ ] A/B testing different prompts
- [ ] Machine learning model training from assessment data
- [ ] Genre-specific scoring models
- [ ] Multi-language support
- [ ] Plagiarism detection integration
- [ ] Reader feedback correlation analysis
- [ ] Automated re-assessment after edits
- [ ] Author skill progression tracking

## Maintenance

### Re-assessment Policy
- Stories are automatically re-assessed after 7 days cooldown
- Authors can request re-assessment after significant edits
- Check `lastAssessedAt` field to prevent spam

### Queue Management
- Failed assessments retry up to 3 times
- Check error logs in `errorMessage` field
- Monitor queue depth via stats endpoint

## Security Considerations

- ✅ Rate limiting on queue endpoint (recommended)
- ✅ Authentication required for process/stats endpoints
- ✅ Content sanitization before sending to LLM
- ✅ Cost limits and monitoring
- ⚠️ Consider implementing daily/monthly budget caps

## Support

For issues or questions:
1. Check the `QualityAssessmentQueue` table for failed items
2. Review `LLMUsageLog` for API errors
3. Monitor costs via stats endpoint
4. Check Next.js logs for detailed error messages

---

**Built with**: Next.js 14, Prisma, OpenAI GPT-4o-mini, TypeScript
**Status**: ✅ Complete - Ready for integration
