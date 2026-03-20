# Comment System Documentation

## Overview

The Chapturs comment system provides work-level and chapter-level commenting with reply threads, moderation tools, and engagement features.

## Features

### Reader Features
- **Post Comments**: Comment on works and individual chapters
- **Reply Threads**: Reply to comments up to 3 levels deep
- **Like Comments**: Show appreciation for helpful or interesting comments
- **Edit Comments**: Edit your own comments within 5 minutes of posting
- **Delete Comments**: Remove your own comments at any time
- **Report Comments**: Flag inappropriate content for moderator review
- **Sort Options**: View comments sorted by newest, oldest, or most liked

### Creator Features
- **Pin Comments**: Highlight important comments at the top
- **Hide Comments**: Hide inappropriate comments from view without deletion
- **Delete Comments**: Remove any comment on your works
- **Moderation Dashboard**: View and manage reported comments
- **Ban Users**: Prevent specific users from commenting (backend ready)

## Database Schema

### Comment Model
```prisma
model Comment {
  id              String    @id @default(cuid())
  workId          String
  sectionId       String?   // null = work-level comment
  userId          String
  content         String    @db.Text
  parentId        String?   // For reply threads
  isEdited        Boolean   @default(false)
  isPinned        Boolean   @default(false)
  isHidden        Boolean   @default(false)
  editedAt        DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### CommentLike Model
```prisma
model CommentLike {
  id        String   @id @default(cuid())
  commentId String
  userId    String
  createdAt DateTime @default(now())
  
  @@unique([commentId, userId])
}
```

### CommentReport Model
```prisma
model CommentReport {
  id        String   @id @default(cuid())
  commentId String
  userId    String
  reason    String   // 'spam', 'harassment', 'spoiler', 'other'
  details   String?  @db.Text
  status    String   @default("pending")
  createdAt DateTime @default(now())
}
```

## API Endpoints

### List Comments
```http
GET /api/works/{workId}/comments?sectionId={sectionId}&sort={sort}&limit={limit}&cursor={cursor}
```

**Query Parameters:**
- `sectionId` (optional): Filter by chapter/section
- `sort`: `newest` | `oldest` | `most-liked`
- `limit`: Number of comments to return (default: 20, max: 100)
- `cursor`: Pagination cursor from previous response

**Response:**
```json
{
  "comments": [
    {
      "id": "comment_id",
      "content": "Great chapter!",
      "user": { "id": "...", "username": "...", "displayName": "..." },
      "likeCount": 5,
      "replyCount": 2,
      "replies": [...],
      "createdAt": "2025-10-15T00:00:00Z"
    }
  ],
  "hasMore": true,
  "nextCursor": "cursor_value"
}
```

### Create Comment
```http
POST /api/works/{workId}/comments
Content-Type: application/json

{
  "content": "Comment text",
  "sectionId": "chapter_id",  // optional
  "parentId": "parent_comment_id"  // optional for replies
}
```

**Validation:**
- Content required and max 5000 characters
- Rate limit: 3 comments per minute
- Max reply depth: 3 levels

### Update Comment
```http
PATCH /api/comments/{id}
Content-Type: application/json

{
  "content": "Updated text",      // Edit content (owner only, within 5 min)
  "isPinned": true,                // Pin comment (creator only)
  "isHidden": true                 // Hide comment (creator only)
}
```

### Delete Comment
```http
DELETE /api/comments/{id}
```

**Authorization:**
- Comment owner can delete own comments
- Work creator can delete any comment on their work
- Moderators/admins can delete any comment

### Like Comment
```http
POST /api/comments/{id}/like
```

Toggles like status (like/unlike).

### Report Comment
```http
POST /api/comments/{id}/report
Content-Type: application/json

{
  "reason": "spam",  // 'spam', 'harassment', 'spoiler', 'other'
  "details": "Optional explanation"
}
```

### Get Moderation Queue
```http
GET /api/creator/moderation/comments?status={status}&limit={limit}
```

**Query Parameters:**
- `status`: `pending` | `reviewed` | `actioned` | `all`
- `limit`: Number of reports to return (default: 50)

## UI Components

### CommentSection
Main component for displaying comments on a work or chapter page.

```tsx
import CommentSection from '@/components/CommentSection'

<CommentSection
  workId={work.id}
  sectionId={section?.id}  // optional for chapter-specific
  canComment={isAuthenticated}
  currentUserId={userId}
/>
```

### CommentModerationPanel
Dashboard for creators to manage reported comments.

```tsx
import CommentModerationPanel from '@/components/CommentModerationPanel'

// Located at /creator/moderation
<CommentModerationPanel />
```

## Integration Guide

### Adding Comments to Work Page

1. Import the CommentSection component
2. Add a "Comments" tab to your work viewer
3. Pass required props

```tsx
import CommentSection from '@/components/CommentSection'
import { useUser } from '@/hooks/useUser'

function WorkPage({ work }) {
  const { userId, isAuthenticated } = useUser()
  
  return (
    <div>
      {/* Other content */}
      
      <CommentSection
        workId={work.id}
        canComment={isAuthenticated}
        currentUserId={userId}
      />
    </div>
  )
}
```

### Adding Comments to Chapter Page

Same as work page, but include `sectionId`:

```tsx
<CommentSection
  workId={work.id}
  sectionId={section.id}
  canComment={isAuthenticated}
  currentUserId={userId}
/>
```

## Security & Validation

### Rate Limiting
- 3 comments per minute per user
- Prevents spam and abuse

### Content Validation
- Max length: 5000 characters
- Required: non-empty content
- HTML sanitization: Strip dangerous tags

### Authorization Checks
- **Create**: Requires authentication
- **Edit**: Owner only, within 5-minute window
- **Delete**: Owner, creator, or moderator
- **Pin/Hide**: Work creator or moderator only
- **Report**: Any authenticated user (one per comment)

### Thread Depth Limit
Maximum 3 levels of replies to prevent deeply nested threads:
```
Comment (Level 0)
└─ Reply (Level 1)
   └─ Reply (Level 2)
      └─ Reply (Level 3) ← Max depth
```

## Moderation Workflow

1. **User Reports Comment**
   - Selects reason (spam, harassment, spoiler, other)
   - Optionally provides details
   - Report status: "pending"

2. **Creator Reviews in Dashboard**
   - Views all pending reports at `/creator/moderation`
   - Sees comment content, reporter, and reason
   - Can filter by work

3. **Creator Takes Action**
   - **Hide**: Hides comment from readers (soft delete)
   - **Delete**: Permanently removes comment
   - **Dismiss**: Marks report as reviewed without action

4. **Report Status Updates**
   - Pending → Reviewed (dismissed)
   - Pending → Actioned (hidden/deleted)

## Best Practices

### For Readers
- Be respectful and constructive
- Use replies to continue discussions
- Report violations of community guidelines
- Edit typos quickly (within 5 min window)

### For Creators
- Pin helpful or important comments
- Respond to reader feedback
- Review moderation queue regularly
- Use hide (not delete) for borderline cases
- Engage with your community

## Future Enhancements

- [ ] Email notifications for comment replies
- [ ] @mention system for tagging users
- [ ] Spoiler tags for sensitive content
- [ ] Work-level comment settings (enable/disable)
- [ ] User blocking (prevent specific users from commenting)
- [ ] Inline/paragraph-level comments
- [ ] Most liked sorting algorithm
- [ ] Real-time comment updates with WebSockets
- [ ] Comment search and filtering
- [ ] Moderation analytics and insights

## Troubleshooting

### Comments Not Loading
- Check network tab for API errors
- Verify workId is correct
- Ensure database migration has run

### Cannot Post Comment
- Verify user is authenticated
- Check rate limit (3/minute)
- Ensure content is not empty and under 5000 chars

### Moderation Actions Not Working
- Verify user has author profile
- Check that author owns the work
- Confirm user has proper permissions

### Type Errors
- Ensure `@/types/comment` is imported correctly
- Check that Comment interface matches API response
- Verify date-fns is installed

## Migration

To apply the comment system schema:

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

The migration file is located at:
`prisma/migrations/20251015005900_add_comment_system/migration.sql`

## Testing

### Manual Testing Checklist
- [ ] Create work-level comment
- [ ] Create chapter-level comment
- [ ] Reply to comment (all 3 levels)
- [ ] Like/unlike comment
- [ ] Edit comment within window
- [ ] Try edit after window (should fail)
- [ ] Delete own comment
- [ ] Report comment
- [ ] Pin comment (as creator)
- [ ] Hide comment (as creator)
- [ ] Delete comment (as creator)
- [ ] View moderation dashboard
- [ ] Test pagination (load more)
- [ ] Test rate limiting

### API Testing
```bash
# Get comments
curl http://localhost:3000/api/works/WORK_ID/comments

# Create comment
curl -X POST http://localhost:3000/api/works/WORK_ID/comments \
  -H "Content-Type: application/json" \
  -d '{"content": "Test comment"}'

# Like comment
curl -X POST http://localhost:3000/api/comments/COMMENT_ID/like
```

## Support

For issues or questions:
1. Check this documentation
2. Review API error messages
3. Check database schema and migrations
4. Verify authentication and permissions
5. Review browser console for errors
