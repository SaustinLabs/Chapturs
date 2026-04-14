# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|
| Frontend / UI / React components | Linus | Feed, reader, editor, forms, modals, responsive layout, Tailwind, TipTap |
| API routes, database, Prisma, auth | Rusty | `/src/app/api/**`, Prisma schema, NextAuth, email, R2, OpenRouter LLM |
| Architecture, code review, planning | Danny | Multi-file decisions, tech debt, new system design, PR review |
| Tests, quality, edge cases | Basher | Playwright e2e, unit tests, QA, security checks |
| Deployment, CI/CD, infra | Danny + Rusty | GitHub Actions workflows, VPS config, env secrets |
| Admin panel work | Rusty | `/src/app/admin/**`, SiteSettings, moderation queue |
| Creator Hub UI | Linus | `/src/app/creator/**`, editor, glossary, analytics |
| Reader Hub UI | Linus | `/src/app/story/**`, chapter reader, feed, InfiniteFeed |
| LLM / AI features | Rusty | Quality assessment, translation, OpenRouter calls |
| Scope & priorities | Danny | What to build next, trade-offs, TASKS.md decisions |
| Session logging | Scribe | Automatic — never needs routing |

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Lead |
| `squad:{name}` | Pick up issue and complete the work | Named member |

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, the **Lead** triages it — analyzing content, assigning the right `squad:{member}` label, and commenting with triage notes.
2. When a `squad:{member}` label is applied, that member picks up the issue in their next session.
3. Members can reassign by removing their label and adding another member's label.
4. The `squad` label is the "inbox" — untriaged issues waiting for Lead review.

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for "what port does the server run on?"
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn the tester to write test cases from requirements simultaneously.
7. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. The Lead handles all `squad` (base label) triage.
