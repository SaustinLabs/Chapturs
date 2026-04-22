---
version: alpha
name: Chapturs
description: >
  Creator-first webnovel platform. Dual Reader/Creator hubs. The visual identity
  is dark-capable, content-forward, and driven by a blue-to-violet brand gradient
  that signals creativity and momentum without overwhelming the fiction being read.
colors:
  primary: "#2563EB"
  primary-dark: "#1D4ED8"
  secondary: "#7C3AED"
  secondary-dark: "#6D28D9"
  surface: "#FFFFFF"
  surface-dark: "#1F2937"
  background: "#FFFFFF"
  background-dark: "#111827"
  on-surface: "#111827"
  on-surface-muted: "#4B5563"
  on-surface-subtle: "#9CA3AF"
  on-surface-dark: "#FFFFFF"
  on-surface-muted-dark: "#9CA3AF"
  border: "#E5E7EB"
  border-dark: "#374151"
  success: "#10B981"
  warning: "#F59E0B"
  danger: "#EF4444"
  hero-from: "#1E3A8A"
  hero-via: "#312E81"
  hero-to: "#4C1D95"
typography:
  h1:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: 800
    lineHeight: 1.2
  h2:
    fontFamily: Inter
    fontSize: 1.875rem
    fontWeight: 700
    lineHeight: 1.25
  h3:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.4
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 40px
components:
  button-primary:
    backgroundColor: "linear-gradient(to right, {colors.primary}, {colors.secondary})"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: 10px 20px
    typography: "{typography.body-sm}"
  button-primary-hover:
    backgroundColor: "linear-gradient(to right, {colors.primary-dark}, {colors.secondary-dark})"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "rgba(255,255,255,0.10)"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 10px 20px
    typography: "{typography.body-sm}"
  button-secondary-hover:
    backgroundColor: "rgba(255,255,255,0.20)"
    textColor: "#FFFFFF"
  button-simple:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 8px 16px
    typography: "{typography.body-sm}"
  button-simple-hover:
    backgroundColor: "{colors.primary-dark}"
    textColor: "#FFFFFF"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 0px
  card-hover:
    backgroundColor: "{colors.surface}"
  badge:
    rounded: "{rounded.full}"
    padding: 4px 8px
    typography: "{typography.label}"
  badge-genre:
    backgroundColor: "#EFF6FF"
    textColor: "#1E40AF"
  badge-discovery:
    backgroundColor: "#F5F3FF"
    textColor: "#5B21B6"
  badge-trending:
    backgroundColor: "#FFF7ED"
    textColor: "#C2410C"
  hero-banner:
    backgroundColor: "linear-gradient(135deg, {colors.hero-from}, {colors.hero-via}, {colors.hero-to})"
    textColor: "#FFFFFF"
    rounded: "{rounded.xl}"
    padding: 32px 40px
---

## Overview

Chapturs is a webnovel platform where the content is always the hero. The visual
language borrows from streaming platforms (discovery-first, card-heavy layouts)
and publishing (strong typographic hierarchy, readable long-form text). The brand
gradient — blue-600 to violet-600 — is the single most recognisable design
element and should appear on primary CTAs and hero surfaces. Everything else
steps back so the stories and covers can breathe.

**Mode**: Dark mode is a first-class experience. Every surface, border, and text
colour has a dark-mode counterpart. Use Tailwind's `dark:` prefix consistently.
Never hardcode hex values — always use the token or its Tailwind equivalent.

**Personality**: Creative, trustworthy, modern. Not corporate. Not edgy. The UI
should feel like a well-designed reading app, not a social network.

## Colors

The palette is split into brand, surface, and semantic layers.

**Brand**
- **Primary (#2563EB):** Chapturs blue. Used for interactive elements, links,
  progress indicators, and the left anchor of the brand gradient.
- **Secondary (#7C3AED):** Chapturs violet. Used as the right anchor of the brand
  gradient and for discovery/premium signals (e.g. the Discovery badge, Platinum
  achievement tier).
- **Brand gradient:** `from-blue-600 to-violet-600`. This is the identity gradient.
  It appears on the primary CTA button, prominent hero prompts, and key conversion
  surfaces. Use sparingly — it should feel earned.

**Surfaces & Backgrounds**
- **surface / surface-dark (#FFFFFF / #1F2937):** Card, modal, sidebar backgrounds.
  `bg-white dark:bg-gray-800`.
- **background / background-dark (#FFFFFF / #111827):** Page-level background.
  `bg-white dark:bg-gray-900`.

**Text**
- **on-surface (#111827):** Primary text. `text-gray-900 dark:text-white`.
- **on-surface-muted (#4B5563):** Secondary/body text, captions.
  `text-gray-600 dark:text-gray-400`.
- **on-surface-subtle (#9CA3AF):** Placeholder text, disabled labels.
  `text-gray-400 dark:text-gray-500`.

**Borders**
- **border / border-dark (#E5E7EB / #374151):** `border-gray-200 dark:border-gray-700`.
  All card and input borders use this pair.

**Semantic**
- **success (#10B981):** Completed states, "Ongoing" status, positive feedback.
- **warning (#F59E0B):** Featured badges, moderate content flags.
- **danger (#EF4444):** Destructive actions, rejection states, errors.

**Hero gradient** (`from-blue-900 via-indigo-900 to-purple-900`): Used exclusively
on the homepage banner and immersive hero sections. Deep and dark — the white text
on top should always be readable. Do not use this for cards or repeated surfaces.

## Typography

**Font:** Inter, variable weight (100–900). Self-hosted via `@fontsource-variable/inter`
— no outbound Google Fonts requests at build time. The CSS variable is `--font-inter`.

**Scale:**
- `h1` (2.25rem / font-extrabold): Page titles, hero headlines. Used once per page.
- `h2` (1.875rem / font-bold): Section headers, modal titles.
- `h3` (1.125rem / font-semibold): Card titles, subsection headers, sidebar items.
- `body-lg` (1.125rem): Hero subtext, prominent descriptions.
- `body-md` (1rem): General prose, form labels, most UI text.
- `body-sm` (0.875rem): Button labels, secondary metadata, captions.
- `label` (0.75rem / font-medium): Badges, tags, chips, timestamp metadata.

**Reading mode**: The `ChaptursReader` component uses a larger body size (up to
1.125rem / 1.25rem) with generous line-height (1.7–1.8). Reading typography is
intentionally distinct from UI typography — do not apply UI font sizes to prose
content in the reader.

## Layout

The platform has two distinct layout contexts:

**Discovery (Reader Hub):** Responsive grid of story cards. Mobile: single column.
Tablet: 2 columns. Desktop: 3 columns. Max content width: `max-w-7xl` (80rem).
Outer padding: `px-4 sm:px-6 lg:px-8`.

**Creator Hub:** Sidebar + main content split. Sidebar is fixed-width on desktop,
collapses on mobile. The creator dashboard uses a denser information layout with
more tables and stat blocks.

**Reading view:** Full-width centered column. Max width `max-w-2xl` (42rem) for
prose content. This is a hard constraint — do not widen reading columns.

Spacing system: xs (4px) → sm (8px) → md (16px) → lg (24px) → xl (32px) →
2xl (40px). Most component internal padding uses `md` or `lg`. Gaps between cards
use `md` (gap-4) or `lg` (gap-6).

## Elevation & Depth

Chapturs uses a flat-first elevation model. Most surfaces are borderless within
their container and rely on background contrast for separation.

- **Default card:** `shadow-sm border border-gray-200 dark:border-gray-700` — subtle
  definition, no float.
- **Hovered card:** `shadow-lg` — cards lift on hover with a `-translate-y-1` transform
  (`transition-all duration-300`). This is the primary interaction affordance on the
  discovery feed.
- **Modal/overlay:** `shadow-xl` or `shadow-2xl` with a `backdrop-blur-sm` scrim.
- **Navbar:** `bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200
  dark:border-gray-700` — frosted glass, stays on top.

Never use elevation to indicate importance within a flat page. Use colour contrast
and typographic weight instead.

## Shapes

- **`rounded` (4px):** Rarely used directly. Inner elements inside a larger rounded
  container (e.g. progress bar inside a card).
- **`rounded-lg` (8px):** Default for cards, buttons, inputs, dropdowns, modals.
  This is the most common radius in the UI.
- **`rounded-xl` (12px):** Prominent CTAs, the brand gradient button, larger action
  surfaces.
- **`rounded-2xl` (16px):** Hero banners, large feature sections, the homepage
  discovery banner.
- **`rounded-full` (9999px):** Badges, genre pills, avatar images, tag chips. Any
  small inline label that needs a pill shape.

## Components

### Button — Primary (Brand Gradient)

The signature CTA. Reserved for the single most important action on a surface
(start reading, join, publish).

```
bg-gradient-to-r from-blue-600 to-violet-600
hover:from-blue-700 hover:to-violet-700
text-white font-semibold text-sm
rounded-xl px-5 py-2.5
shadow-md hover:shadow-lg
transition-all
```

Do not use this button more than once per screen section. If two actions exist,
the secondary action gets `button-secondary` or a ghost style.

### Button — Simple (Solid Blue)

For standard actions inside cards, tables, and non-hero contexts where the gradient
would be too loud.

```
bg-blue-600 hover:bg-blue-700
text-white text-sm rounded-lg px-4 py-2
transition-colors
```

### Button — Ghost (on dark backgrounds)

Used inside hero banners where the background is already brand-coloured.

```
bg-white/10 hover:bg-white/20
text-white font-medium rounded-lg px-5 py-2.5
transition-colors
```

### Story Card (FeedCard)

The core discovery unit. Displays cover art, title, genre badges, and metadata.

```
bg-white dark:bg-gray-800
rounded-lg shadow-sm
border border-gray-200 dark:border-gray-700
hover:shadow-lg transition-all duration-300
hover:-translate-y-1
overflow-hidden
```

Cover art fills the top portion of the card as an image with `object-cover`.
Title is `h3` weight. Author name and chapter count use `body-sm` muted text.
Cards always have a minimum height to avoid jarring reflow as images load.

### Genre / Status Badge

Small pill labels that identify story genre, feed position (Subscribed, Trending,
Discovery, etc.), and content status.

```
inline-flex items-center
px-2 py-1 rounded-full
text-xs font-medium
```

Colour is semantic per feed type (see Components in YAML). Never use the brand
gradient on badges — it dilutes the CTA signal.

### Hero Banner

The homepage discovery prompt and key conversion surfaces.

```
rounded-2xl
bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900
px-6 py-8 sm:px-10
text-white
```

White text only. The headline uses `h1` weight. Subtext uses `body-lg` at
`text-blue-100` to maintain hierarchy without full contrast jump. Stat pills
use `bg-white/10 rounded-lg px-3 py-2`.

## Do's and Don'ts

**Do:**
- Use `dark:` variants for every colour-bearing class — no surface should look
  broken in dark mode.
- Use the brand gradient exclusively on primary CTAs and hero surfaces.
- Let cover art dominate cards — avoid overlaying heavy UI chrome on images.
- Use `rounded-lg` as the default radius. Deviate only when the spec above says so.
- Keep reading columns narrow (`max-w-2xl`). Resist the urge to widen them.
- Pair `shadow-sm` + border for resting cards and `shadow-lg` + lift for hover.
- Use Inter variable weight — `font-semibold` (600) for headings, `font-medium` (500)
  for labels, normal (400) for body text.

**Don't:**
- Don't hardcode hex values in components — use Tailwind's colour scale or the
  tokens above.
- Don't apply the hero gradient (#1E3A8A → #4C1D95) to repeated elements like
  cards or nav items. It's for hero/feature moments only.
- Don't mix elevation (shadow-xl) with the same flat surface pattern — pick one
  depth level per component and stick to it.
- Don't widen the reading column beyond `max-w-2xl`, even for premium/desktop views.
- Don't use `font-extrabold` below `h2` level — it draws too much weight away from
  the content.
- Don't add new accent colours without discussing — the palette is intentionally
  minimal. Status colours (success/warning/danger) are semantic only and should not
  appear in decorative contexts.
- Don't suppress the `dark:` prefix by wrapping components in a light-only container
  unless it's a specific design decision (e.g. print preview).
