You are taking over implementation for Chapturs. Execute work directly in the repository with minimal back-and-forth. Make decisions when documentation is incomplete. Do not stop at planning.

Primary execution order
1. Use [plan/architecture-buildout-master-1.md](plan/architecture-buildout-master-1.md) as the controlling orchestration spec.
2. Implement details from these child specs in the order and phase gates defined by the master spec:
   - [plan/feature-monetization-completion-1.md](plan/feature-monetization-completion-1.md)
   - [plan/feature-ecosystem-expansion-1.md](plan/feature-ecosystem-expansion-1.md)
   - [plan/feature-writers-room-living-world-1.md](plan/feature-writers-room-living-world-1.md)
   - [plan/feature-ai-author-bots-1.md](plan/feature-ai-author-bots-1.md)

Non-negotiable project rules
1. Treat [TASKS.md](TASKS.md) as source of truth.
2. On shipped or status-changing work, update [TASKS.md](TASKS.md) in the same commit.
3. Keep public status pages aligned in same commit when status changes:
   - [src/app/about/roadmap/page.tsx](src/app/about/roadmap/page.tsx)
   - [src/app/features/page.tsx](src/app/features/page.tsx)
4. Use OpenRouter only for LLM features and preserve required headers and models from repo conventions.
5. Keep admin/security checks strict for new admin or scheduler endpoints.
6. No separate mobile code path. Preserve responsive behavior in existing patterns.

Execution protocol
1. Start with Master Plan Phase 1 tasks and complete all gating artifacts before moving to schema-heavy work.
2. For any Prisma schema work, follow migration sequencing from the master plan and avoid parallel conflicting edits to [prisma/schema.prisma](prisma/schema.prisma).
3. Ship in small, mergeable increments. Do not create one giant branch.
4. After each completed phase, provide:
   - Files changed
   - Tests run and results
   - Task IDs updated in [TASKS.md](TASKS.md)
   - Risk notes and rollback notes
5. If blocked by missing external config (secrets, env, third-party account setup), continue implementing everything else, then leave a precise unblock checklist.

Definition of done for each phase
1. Code implemented and lint/build pass for changed scope.
2. Relevant tests added or updated and passing.
3. Plan task table updated in the active plan file(s).
4. [TASKS.md](TASKS.md) status updated consistently.
5. If feature status changed, roadmap/features pages updated in same commit.

Immediate kickoff steps
1. Read and summarize Master Plan Phase 1 in execution terms (no redesign).
2. Implement the first unfinished Phase 1 task immediately.
3. Continue autonomously until all Master Plan Phase 1 tasks are complete.
4. Then proceed to Master Plan Phase 2 without waiting for additional confirmation.

Output format expected after each work chunk
1. Completed items (with task IDs)
2. Files changed
3. Validation performed
4. Remaining items in current phase
5. Next action being executed now

Do not ask for a new plan. The plan already exists. Execute it.