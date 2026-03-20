# Feature Systems Summary

**Editor & Content Format**
- Source: docs/source/features/NEW_EDITOR_DOCUMENTATION.md. New block-based editor replaces CreatorEditor/ExperimentalEditor; supports prose, dialogue, chat, phone UI, narration blocks, live preview, auto-save. Key paths: `src/components/ChaptursEditor.tsx`, `src/components/BlockEditors.tsx`, `src/types/chapt.ts`, demo at `/test/editor`.
- Source: docs/source/features/CREATOR_EDITOR_DOCUMENTATION.md. Legacy/creator editor system documentation (details not repeated here; keep as historical reference for migration).

**Glossary & Character Systems**
- Source: docs/source/features/GLOSSARY_SYSTEM.md. Chapter-aware glossary definitions with versioning (GlossaryEntry + GlossaryDefinitionVersion), hover tooltips, API endpoints for create/get by chapter.
- Source: docs/source/features/CHARACTER_PROFILE_SYSTEM.md. Character profiles with chapter-aware versions, relationships, tooltip highlights, and editor/sidebar integration; API endpoints for create/update/delete/relationships.

**Comment System**
- Source: docs/source/features/COMMENT_SYSTEM_DOCUMENTATION.md. Work- and chapter-level comments with 3-level threading, likes, reports, moderation queue, pin/hide, rate limits (3/min), edit window (5 min). Prisma models: Comment, CommentLike, CommentReport. UI components: CommentSection, CommentModerationPanel. API paths under `/api/works/[workId]/comments`, `/api/comments/[id]`.

**Emoji System**
- Source: docs/source/features/EMOJI_SYSTEM_DOCUMENTATION.md. Emoji picker with search, categories, recent history; integrates into ExperimentalEditor, RichTextEditor, and CommentForm. Utilities in `src/lib/emoji/*` and hook `src/hooks/useEmojiAutocomplete.ts`.

**Content Moderation**
- Source: docs/source/features/CONTENT_MODERATION.md. Validation tiers (first chapter strict vs. subsequent basic), moderation queue, ContentValidation/ContentModerationQueue/ValidationRule schemas, API paths under `/api/moderation/*` and publish endpoints.

**Image Upload Architecture**
- Source: docs/source/features/IMAGE_UPLOAD_ARCHITECTURE.md. Architecture for presigned uploads to Cloudflare R2, optional Sharp image processing, AI moderation, and variant generation. Key paths referenced include `src/lib/r2.ts`, `src/app/api/upload/*`, `src/components/ImageUpload.tsx`.

**Fanart Management**
- Source: docs/source/features/FANART_MANAGEMENT_SYSTEM.md. Creator fanart review dashboard at `/creator/fanart`, approval/rejection workflow, and API `GET /api/creator/fanart` plus existing approve/reject endpoint under `/api/works/[id]/characters/[characterId]/submissions`.

**Quality Assessment**
- Source: docs/source/features/QUALITY_ASSESSMENT_SYSTEM.md. LLM-based scoring with 6 dimensions, tiered visibility boosts, discovery tags, feedback, and queue processing. Key services: `src/lib/quality-assessment/*`, UI: `src/components/QualityCelebration.tsx`, API paths under `/api/quality-assessment/*`.

**Work-Specific Management**
- Source: docs/source/features/WORK_SPECIFIC_MANAGEMENT.md. New creator pages `/creator/glossary` and `/creator/characters` to select a work before managing glossary/characters, with API `GET /api/creator/works` returning counts.

**Notes on Dates**
- Most files share the same filesystem timestamp; see docs/summaries/source-index.md and any in-file dates (e.g., Character/Profile and API map documents) for more reliable timelines.
