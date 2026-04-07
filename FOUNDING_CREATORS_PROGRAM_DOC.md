# Founding Creators Program (Chapturs Beta)

## Goals
- Bootstrap engagement early by encouraging authors to publish and readers to interact.
- Create visible, shareable “early legitimacy” for first authors/creators.
- Turn repeated platform actions (reading, commenting, creating, translations/audiobooks/fan-art) into a points → levels → achievements system.

---

## 1) Achievements, Points, Levels (Public + Toggleable)
**Core system**
- Users earn **points** for meaningful actions.
- Points determine **levels**.
- Specific moments/milestones earn **achievements/badges**.

**Where it shows**
- Achievements/badges + level display on the user profile.
- Profiles have **block sections**.
- Add a dedicated **“Achievements / Level” profile block**.
  - Users can toggle whether the block appears.
  - Users can pin certain achievements inside that block to highlight accomplishments (optional).

---

## 2) Founding Creator Cohort (Early Status)
- Award a **Founding Creator** badge to the **first cohort of authors** who publish.
- Suggested cohort size: **first 100 authors**.
- Visible on the author profile as a notable achievement.
- (Later) Optionally highlight founding creators in discovery surfaces.

---

## 3) Reward Triggers (Points-Earning Events)
Badges/achievements are typically smaller milestones; bigger contributions earn larger point values.

### A) Reader Milestones (First Reader)
- “First reader of a work” earns points and/or a badge.
- To prevent disputes for near-simultaneous readers:
  - Award via **batching / capped early winners** (first handful), instead of strict first-come.

Suggested small example values (tune during beta):
- First reader badge: **5 points**

### B) Reader Milestones (Comment Milestones)
- “10th comment” (and similar thresholds) grants points/achievements.
- Also use batching/window logic if needed to keep it fair.

### C) Author Publication Milestones
- Publishing a chapter / part earns points.
- Releasing over time can be supported later (if your scheduling/release cadence exists).

### D) High-Impact Creator Contributions
These should be **big point earners**:
- **Audiobooks** (strong points)
- **Translations** (strong points)
- **Fan art** (strong points)

If/when there is an integration path later (you mentioned it’s not fully in place yet):
- Extra points if the author/user contribution is **featured on the character profile / official audiobook / official translation**.
  - Note: currently only uploads work; integration into character profiles is not fully in place yet.

---

## 4) Glossary & Character Index Achievements (Author-Owned Editing)
**Important constraint (current reality):**
- Only **authors** can submit/edit the **glossary** and **character index**.
- Points that depend on glossary/index edits should apply only to authors who use these author tools.

### A) Glossary achievements across time
Your glossary supports an evolving meaning/story context.
- Example: a term can have separate definitions per chapter context.
- Edits across a long story (e.g., 100 chapters) can create multiple distinct definition entries over time.

**Achievement behavior**
- Each new glossary entry (or each distinct definition instance over time) can count separately.
- A user can earn milestones such as:
  - “Make your 100th glossary entry”

### B) Character index achievements
- Allow milestones like:
  - “Add 25 characters to your character index”

---

## 5) Points → Levels → Achievements (Naming / Values)
- Treat achievements/badges as a **points-awarding layer**.
- Example values can be tuned; keep the system flexible:
  - small badge: 5 points
  - medium milestone: ~100 points
  - major contributions (audiobooks/translations/fan-art + featured placements later): 100s–1000s

---

## 6) Author Publishing Experience (Low-Friction Beta)
To make participation easy, authors need an obvious choice for getting content into the platform.

### Current reality (known)
- There is an area for authors to submit documents that get parsed and formatted.

### Desired enhancement (concept)
Provide a publishing option set in the editor flow:
- **Upload document** (existing parsing + formatting)
- **Paste document** (new behavior)
- **Continue in text editor / work from scratch**

### Why this matters
- Authors can quickly drop in a finished chapter/part.
- The system auto-formats into a readable layout.
- Authors then set release frequency and publish.

(Full detailed editor implementation is TBD; this doc only specifies the intended UX choices.)

---

## 7) Moderation / Pipeline Notes (Translations, Contributions)
There exists a pipeline of some sort for translation/audience-related contributions.
- The program can reference “accepted/used” contributions for extra points once those rules are clearly defined.
- Implementation details are TBD.

---

## Open Questions for Implementation
1) What exact point values do you want for each badge/milestone class (small/medium/large)?
2) What fairness windows/caps do you want for “first reader” and comment milestones?
3) How should achievements be displayed inside the “Achievements / Level” profile block (sorting, pin rules, layout)?
4) Confirm which contribution types currently exist in a usable form:
   - uploads exist
   - integration into character profiles is not fully in place yet
   - translations/audiobooks/fan-art point eligibility rules
5) For publishing: do you want “release frequency” to be strict (e.g., scheduled) or just a metadata label in beta?
