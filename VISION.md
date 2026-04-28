# Chapturs — Project Charter

## What Is This?
"YouTube for webnovels" — a grassroots fiction platform with seamless reading UX, fair creator monetization, and global reach via translation.

## Core Principles (non-negotiable)
1. **No pay-per-read.** Sam adamantly opposes this model. Revenue share (70/30 to authors) and premium (no-ad) only.
2. **Frictionless creator experience.** Universal story importers over complex front-facing AI tools. If it's hard for an author, don't build it.
3. **Seamless reading UX.** The reader should never feel friction — no ads, no paywalls mid-chapter, clean mobile experience.
4. **Global reach via translation.** Any story in any language can reach any audience. Translation is a feature, not an afterthought.

## What We're Building (current priorities)
- Feed system with Redis caching + intelligent recommendation engine
- Bulk import endpoint (`/api/works/[id]/import`) for universal story ingestion
- Auto-translation pipeline (5-phase design doc)
- Block editor with 8 types including phone UI simulations
- Fair creator monetization (70% revenue share, premium tier)

## What We're NOT Building
- Pay-per-read systems
- Syosetu replacement (Chapturs is a case study showing adaptation potential)
- Over-engineered AI frontends that complicate the author workflow

## Decision Rule
When in doubt between two approaches: pick the one that's simpler for creators and smoother for readers. If it adds complexity, question whether it adds enough value to justify it.
