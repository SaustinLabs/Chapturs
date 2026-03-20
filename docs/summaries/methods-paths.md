# Methods, Commands, and Key Paths

**Common Commands**
- `npx prisma generate`
- `npx prisma db push`
- `npx prisma migrate deploy`
- `npx prisma studio`
- `npm run dev`, `npm run build`
- `node scripts/process-queue.js` (quality assessment queue processor)

**Common API Endpoints**
- Comments: `/api/works/[workId]/comments`, `/api/comments/[id]`, `/api/comments/[id]/like`, `/api/comments/[id]/report`
- Quality assessment: `/api/quality-assessment/queue`, `/api/quality-assessment/process`, `/api/quality-assessment/[workId]`, `/api/quality-assessment/stats`
- Creator works listing: `/api/creator/works`
- Fanart: `/api/creator/fanart` and `/api/works/[id]/characters/[characterId]/submissions`
- Uploads: `/api/upload/request`, `/api/upload/confirm`, `/api/upload/delete`
- Cron (if enabled): `/api/cron/process-assessments`, `/api/cron/flush-analytics`

**Common Paths**
- Editor: `src/components/ChaptursEditor.tsx`, `src/components/BlockEditors.tsx`, `src/types/chapt.ts`
- Comments UI: `src/components/CommentSection`, `src/components/CommentModerationPanel`
- Emoji: `src/components/EmojiPicker.tsx`, `src/lib/emoji/*`, `src/hooks/useEmojiAutocomplete.ts`
- Quality assessment: `src/lib/quality-assessment/*`, `src/components/QualityCelebration.tsx`
- Image uploads: `src/lib/r2.ts`, `src/components/ImageUpload.tsx`, `src/app/api/upload/*`
- Work management: `src/app/creator/glossary/page.tsx`, `src/app/creator/characters/page.tsx`, `src/app/api/creator/works/route.ts`

**Test Pages**
- `/test/editor`
- `/test/emoji`
- `/test-upload`
