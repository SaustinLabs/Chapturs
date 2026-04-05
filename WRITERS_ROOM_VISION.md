# The Writers Room — Living World Vision

> *"A single world. Infinite stories. One expanding truth."*

---

## The Core Concept

The Writers Room is a **collaborative fiction layer** on top of Chapturs. Instead of every creator writing in isolation, a curated set of writers contribute to a single canonical shared universe — the **Living World**. Each story is independent, but all of them draw from and contribute back to a shared lore layer that grows with every chapter published.

Think: the Marvel Cinematic Universe, but the creators are the writers, and the worldbuilding bible is a living, AI-maintained document that expands like a spider web.

---

## The Three Pillars

### 1. The Lore Web
Every story written in the Living World deposits lore into the **canon graph**:
- Characters introduced (with stats, traits, affiliations)
- Locations described
- Events that occur
- Factions, magic systems, technologies mentioned

These are auto-extracted by the **Lore Master** (an AI agent) and woven into the shared world graph. Any writer can query this graph when writing their next chapter — "What do we know about the City of Vael?" — and the Lore Master answers with canon.

The web only ever expands. It does not contradict. Contradiction is the only thing that triggers rejection.

---

### 2. The Bounded History System

The world has exactly **two canon anchors** visible to all writers:

- **The Beginning** — A short canonical opening event. The first age of the world, written by the world founders. This is immutable.
- **The End** — A short canonical final event. The known fate of the world (or the last known record). Also immutable.

Between these two points, **everything is fair game**.

This solves the explosion problem: a writer cannot blow up the world, because the world's end is already written. They can destroy cities, kill characters and factions — but the world itself persists to its written conclusion.

#### What this enables:
- Writers can write prequels, present-day stories, and far-future stories
- Timeline gaps are intentional creative space
- Readers can piece together the full history across stories
- The world feels *deep* because no single story can ever fully explain it

---

### 3. Canon Characters vs. Free Characters

Characters divide into two categories:

#### Canon Characters (Immune)
Characters that appear in The Beginning or The End are **immune from death or permanent alteration** outside of stories explicitly set in those eras. Any story that kills a canon character is flagged for rejection.

Writers can:
- Write these characters at any point in their lives
- Explore their motivations, relationships, past trauma
- Even make them antagonists

Writers cannot:
- Kill them (outside the founding eras)
- Contradict their established physical traits or core identity
- Have them do something The End proves impossible (e.g., a character who is alive at The End cannot die in a mid-timeline story)

#### Free Characters (Created by writers)
Characters introduced outside the founding eras are **fully owned by their creators**. They can die, change, disappear. Other writers can reference them, but cannot control their fate without the original author's blessing.

---

## The Lore Master — AI Agent

The Lore Master is an AI agent (Groq/Claude API backed) that serves three roles:

### Role 1: Lore Librarian
Answers writer queries in natural language:
> "What is the political situation in the Northern Reaches during the Second Age?"
> "List all known characters with ties to the Ashen Order."
> "Has anyone described the Temple of Vael's interior?"

The Lore Master reads the full canon graph and synthesises an answer. It flags when something is **unknown** (not yet written) vs. **known but sparse** vs. **well established**.

### Role 2: Contradiction Detector
Before a chapter is published (at the quality assessment step), the Lore Master scans for:
- **Hard contradictions**: killing a canon character, contradicting a fixed event
- **Soft contradictions**: describing a location differently, altering a faction's established allegiance
- **Timeline impossibilities**: character appears in two places simultaneously

Hard contradictions → chapter is blocked with specific explanation.
Soft contradictions → chapter is flagged with a warning for author to review.

### Role 3: Lore Extractor
After a chapter passes review, the Lore Master reads it and extracts:
- New characters, locations, factions, items
- New established facts about existing entities
- Events with timestamps in the world timeline

These are added to the canon graph automatically, with the chapter as the citation source. Every fact knows exactly which chapter established it.

---

## The Spider Web Model

The lore graph is a **directed citation network**, not a flat database.

```
[Chapter: The Ashen Covenant #1]
       ↓ establishes
[Faction: The Veiled Court]
       ↓ referenced by
[Chapter: Hollow Wind #3] → [Character: Mira, last known member]
       ↓ contradicts?
[Canon fact: The Veiled Court was dissolved in the First Culling]
       → WARNING issued
```

New facts cite their source. Contradictions point to the conflict. The web grows outward from the founding eras. Writers can browse the web and find which chapters established which facts — and which parts of the world are **uncharted** (ready for their story to claim).

Uncharted territories are surfaced to writers as creative prompts:
> "The ruins east of Calden's Peak have never been explored in any story. This is your white space."

---

## Rejection and Warning Flow

### On chapter submission (preview):
1. Chapter text is sent to Lore Master alongside relevant canon context
2. Lore Master returns a **clearance report**:
   - ✅ Clear — no issues
   - ⚠️ Warning — soft contradiction or ambiguity (writer must acknowledge before publishing)
   - ⛔ Rejected — hard contradiction (must revise before publishing)

### For rejections:
- Specific passage highlighted
- Exact canon fact being violated, with citation to source chapter
- Suggested resolution: "Option A: move this scene 200 years later. Option B: change this character's identity."
- Author may appeal to a human moderator if they believe the Lore Master is wrong

### For warnings:
- Soft warnings do not block — author sees a one-screen review showing the conflict
- Author can: acknowledge + publish, revise, or request a canon update (if they believe the canon is wrong and their version is better)
- Canon update requests go to a **World Council** (founding creators + admins) for vote

---

## The World Council

For a living world to stay coherent, someone has to have final say on canon disputes.

The World Council is a small group (3–7 people) consisting of:
- The world founders (you, initially)
- Promoted founding writers who demonstrate canon literacy
- Possibly, a community-elected representative if the world grows large enough

Responsibilities:
- Reviewing canon update requests
- Writing official lore entries for disputed territory
- Updating The Beginning and The End (extremely rare, requires full council consensus)
- Admitting new writers to the Living World

---

## What This Looks Like to a Reader

Readers see Living World stories tagged with a **world badge** — a small icon indicating the story belongs to the shared universe.

From any story, a reader can:
- Open the **World Atlas**: a browseable map of the world, populated by all stories
- View the **Lore Index**: character cards, faction cards, location pages — each with links to the chapters that established them
- Follow a character across multiple stories by different authors
- See the **Timeline View**: all stories plotted on the world's history, showing which eras are dense with stories and which are unexplored

For readers, the Living World is a discovery mechanism. One great story leads them to five others through the web of shared characters, locations, and events.

---

## Launch Strategy for the Writers Room

Given the editorial complexity, this should be a **Phase 2** feature after the platform has 500+ daily readers.

**Soft launch sequence:**
1. Write The Beginning and The End yourself (500–800 words each)
2. Set up 3–5 founding characters and 2–3 key locations as immutable canon
3. Invite 5–8 writers you've vetted to write the first wave of stories
4. Let the Lore Master run on their chapters and tune the detection
5. Open to all platform writers once the graph has 50+ established lore entries and the system has been stress-tested

**The pitch to writers:**
> "Your story is part of something bigger. Readers will find you through other writers. Your characters might survive in other people's stories long after your serial ends."

---

## Technical Implementation Notes

### Data model additions needed:
- `LivingWorld` — world definition (name, founding era docs, rules)
- `CanonEntry` — extracted lore fact (type, content, confidence, source chapter)
- `CanonCharacter` — immune characters with trait locks
- `LoreContradictionFlag` — per-chapter flag with type (hard/soft), description, resolution status
- `WorldCouncilVote` — for canon update requests

### API additions needed:
- `POST /api/lore/query` — writer asks Lore Master a question
- `POST /api/lore/check-chapter` — pre-publish contradiction scan
- `GET /api/lore/graph` — browse the full canon graph
- `POST /api/lore/propose-update` — submit a canon update request to World Council

### AI integration:
- Use Groq API (already integrated) for Lore Master queries
- System prompt includes full canon graph context (chunked for context window)
- Contradiction detection uses structured output (JSON response with flagged passages)

---

## The Hardest Problem

**Continuity at scale.** When 50 writers have each published 20 chapters, the canon graph has thousands of entries. No context window can hold it all. The Lore Master will need:

- A **vector-indexed** lore database (embeddings per canon entry)
- Semantic retrieval for relevant context before answering
- A confidence score system — older, more-cited facts have higher authority than recently added ones

This is non-trivial engineering. It's the reason this is Phase 2.

But it's also why, if you build it right, no other webnovel platform has anything like it.

---

*This document is a live vision spec. Implementation details will evolve.*
*Last updated: April 2026*
