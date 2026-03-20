# Content Moderation System

## Overview

Chapturs implements a comprehensive content moderation system to ensure quality and safety before content reaches users. The system provides different validation levels for first chapters vs. subsequent chapters.

## Validation Levels

### First Chapter Validation (Strict)
- **Plagiarism Detection**: Checks for similarity against existing published works
- **Duplicate Content Detection**: Prevents reuploads of other creators' content
- **Content Safety**: Scans for inappropriate content (nudity, violence, hate speech)
- **Quality Checks**: Validates content length, readability, and structure

### Subsequent Chapters Validation (Basic)
- **Content Safety**: Basic inappropriate content scanning
- **Quality Checks**: Content length and basic structure validation

## Database Schema

### ContentValidation
Tracks individual validation results for works and sections.

```sql
- id: String (primary key)
- workId: String? (foreign key to Work)
- sectionId: String? (foreign key to Section)
- validationType: String ('plagiarism', 'duplicate', 'safety', 'quality')
- status: String ('pending', 'passed', 'failed', 'flagged')
- score: Float? (confidence score 0-1)
- details: String (JSON with validation details)
- reviewedBy: String? (moderator user ID)
- reviewedAt: DateTime?
- createdAt: DateTime
- updatedAt: DateTime
```

### ContentModerationQueue
Queue for manual review of flagged content.

```sql
- id: String (primary key)
- workId: String?
- sectionId: String?
- priority: String ('low', 'normal', 'high', 'urgent')
- reason: String (why it needs moderation)
- status: String ('queued', 'in_review', 'approved', 'rejected')
- assignedTo: String? (moderator user ID)
- assignedAt: DateTime?
- completedAt: DateTime?
- notes: String? (moderator notes)
- createdAt: DateTime
- updatedAt: DateTime
```

### ValidationRule
Configurable validation rules.

```sql
- id: String (primary key)
- name: String (unique)
- type: String ('plagiarism', 'duplicate', 'safety', 'quality')
- isActive: Boolean
- config: String (JSON configuration)
- severity: String ('low', 'medium', 'high', 'critical')
- createdAt: DateTime
- updatedAt: DateTime
```

## API Endpoints

### Publishing Workflow
- `POST /api/works/publish` - Validates first chapter before publishing
- `POST /api/works/[id]/sections` - Validates sections based on chapter order

### Moderation
- `GET /api/moderation/queue` - Get moderation queue
- `GET /api/moderation/queue/[id]` - Get specific moderation item details
- `PATCH /api/moderation/queue/[id]` - Approve/reject/flag content

## Content Validation Service

### Core Methods

#### `validateContent(workId, sectionId, content, options)`
Main validation entry point that orchestrates all checks based on validation level.

#### `checkPlagiarism(content, workId)`
- Calculates text similarity against published works
- Uses cosine similarity on word frequency vectors
- Flags content with >80% similarity

#### `checkDuplicates(content, workId)`
- Placeholder for exact duplicate detection
- Future: Hash-based duplicate detection

#### `checkContentSafety(content, workId)`
- Scans for unsafe patterns (profanity, violence, hate speech)
- Considers work maturity rating
- Future: Image safety analysis for thumbnails

#### `checkContentQuality(content)`
- Validates minimum word count (100 words)
- Checks for excessive repetition
- Ensures reasonable content length

## Moderation Dashboard

Located at `/moderation`, provides:
- Queue management with priority sorting
- Content preview with validation results
- Approve/reject/flag actions
- Batch processing capabilities

## Workflow

1. **Author submits first chapter**
   - System runs comprehensive validation
   - If validation fails → Content flagged for moderation
   - If validation passes → Content published immediately

2. **Author submits subsequent chapters**
   - System runs basic validation
   - Content published immediately if validation passes
   - Failed validation prevents publishing

3. **Moderators review flagged content**
   - Access moderation dashboard
   - Review content with validation details
   - Approve, reject, or flag for further review

## Future Enhancements

- **AI-Powered Detection**: Integrate with external AI services for better content analysis
- **Image Safety**: Automatic thumbnail and image content moderation
- **User Reporting**: Allow users to report inappropriate content
- **Automated Rules**: Machine learning-based rule updates
- **Bulk Moderation**: Tools for handling large volumes of content
- **Audit Trail**: Complete history of moderation actions

## Configuration

Validation rules can be configured via the `ValidationRule` table:
- Enable/disable specific checks
- Adjust severity thresholds
- Configure validation parameters
- Set up automated responses

## Security Considerations

- Content validation happens before database storage
- Failed validation prevents content pollution
- Moderation actions are logged and auditable
- Rate limiting on publishing attempts
- User authentication required for all operations