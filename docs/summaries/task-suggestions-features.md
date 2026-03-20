# Task Suggestions (Feature Extensions)

These are feature extensions and fixes based on existing system docs. Each item is scoped so it can be executed independently.

## 1. Comment System: Finish Pending Features
Reason: Most-liked sorting, @mentions, and spoiler tags are listed as future enhancements.
Reference: docs/source/features/COMMENT_SYSTEM_DOCUMENTATION.md, docs/source/implementations/COMMENT_SYSTEM_SUMMARY.md
Acceptance:
- Most-liked sorting implemented.
- @mentions with basic notifications or UI highlighting.
- Spoiler tag formatting with safe reveal UX.

## 2. Quality Assessment: Add Budget Guardrails (Completed 2026-03-20)\nReason: System depends on LLM calls; cost caps and throttles are not enforced.\nReference: docs/source/features/QUALITY_ASSESSMENT_SYSTEM.md, docs/source/testing/QUALITY_ASSESSMENT_QUICKSTART.md\nDone:\n- Added optional daily/monthly budget caps enforced before queue processing.\n- API returns 429 with cap details when exceeded.\n- Dev queue processor logs budget cap responses.\n\n## 3. Translation Menu MVP (Tier 1 + Tier 3)
Reason: Fan content ecosystem is ambitious; start with a minimal usable slice.
Reference: docs/source/plans/FAN_CONTENT_ECOSYSTEM.md, docs/source/implementations/TRANSLATION_COLLABORATION_IMPLEMENTATION.md
Acceptance:
- Chapter language selector UI with Tier 1 official and Tier 3 submissions.
- Basic quality voting with 3 dimensions.
- Default selection rules implemented for one language.

## 4. Creator Profile System: Phase 1 Build
Reason: Detailed design exists but implementation is not complete.
Reference: docs/source/plans/CREATOR_PROFILE_SYSTEM.md, docs/source/implementations/PROFILE_EDITOR_IMPLEMENTATION_SUMMARY.md
Acceptance:
- Read-only public profile page.
- Basic profile data model + migration.
- One starter template.

## 5. Work-Specific Management: Detail Pages
Reason: Work selection pages exist; detail pages are listed as next steps.
Reference: docs/source/features/WORK_SPECIFIC_MANAGEMENT.md
Acceptance:
- `/creator/works/[id]/glossary` detail page.
- `/creator/works/[id]/characters` detail page.
- CRUD for terms/characters scoped to work.

## 6. Image Upload: Variant Generation + Cropping
Reason: Architecture mentions variants; editor UX would benefit from crop/resize.
Reference: docs/source/features/IMAGE_UPLOAD_ARCHITECTURE.md, docs/source/implementations/IMAGE_UPLOAD_IMPLEMENTATION.md
Acceptance:
- Server-side generation of thumbnail/optimized/original.
- Client-side crop tool for profile and cover images.

## 7. Fanart Moderation: Batch Actions
Reason: Fanart review workflow could be faster with batch approve/reject.
Reference: docs/source/features/FANART_MANAGEMENT_SYSTEM.md
Acceptance:
- Multi-select with batch approve/reject.
- Status counts update correctly.

## 8. Content Moderation: Reader Reports
Reason: User reporting is listed as a future enhancement.
Reference: docs/source/features/CONTENT_MODERATION.md
Acceptance:
- Reader report flow on chapters.
- Reports appear in moderation queue.
- Basic triage statuses (queued, in_review, resolved).

