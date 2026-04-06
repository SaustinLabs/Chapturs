# 🌍 Chapturs Auto-Translation System

## Overview

This document outlines the implementation of a **Twitter/X-style automatic translation system** for Chapturs. The goal is to make all content on the platform readable in the user's preferred language **by default**, while preserving original content and enabling community-driven improvements.

---

## 🧠 Core Concept

Chapturs will maintain two layers of content:

1. **Canonical Content (Source of Truth)**
   - Stored exactly as written by the author
   - Never modified

2. **Translated Content (User View Layer)**
   - Generated dynamically per user language
   - Cached and improved over time

---

## 🏗️ Architecture

### Flow

```
User creates content (original language)
→ Store original text

User views content
→ Detect user language
→ If different from original:
     → Check translation cache
     → If exists: return
     → If not:
          → Translate
          → Store in cache
          → Return
```

---

## 🌐 Language Detection

Priority order:

1. User profile preference
2. Browser `Accept-Language`
3. Default: `en`

### Example

```ts
function getUserLanguage(req) {
  return (
    req.user?.preferredLanguage ||
    req.headers["accept-language"]?.split(",")[0] ||
    "en"
  );
}
```

---

## ⚡ Translation Layer

### Requirements

- Fast
- Cacheable
- Swappable providers

### Wrapper Function

```ts
async function translate(text, from, to) {
  const cacheKey = hash(text + from + to);

  const cached = await db.translationCache.find(cacheKey);
  if (cached) return cached.translated_text;

  const result = await provider.translate(text, { from, to });

  await db.translationCache.insert({
    key: cacheKey,
    text,
    from,
    to,
    translated_text: result,
    votes: 0,
    edited_by_user: false
  });

  return result;
}
```

---

## 🗄️ Database Schema

### Table: `translations`

```ts
{
  id: string,
  content_hash: string,
  source_lang: string,
  target_lang: string,
  translated_text: string,
  provider: string,
  confidence_score: number,
  votes: number,
  edited_by_user: boolean,
  created_at: Date,
  updated_at: Date
}
```

---

## 🧩 Content Strategy

| Content Type | Strategy |
|-------------|--------|
| Stories / Chapters | Translate on read + cache |
| Comments | Translate on read |
| Titles | Translate + allow override |
| UI Text | Pre-translated |

---

## 🎛️ Frontend UX

### Behavior

- Automatically show translated content
- Display small label: "Translated from X"
- Allow toggle: "Show original"

### Example Component

```tsx
if (userLang !== originalLang) {
  return (
    <>
      <TranslatedText text={translated} />
      <small>
        Translated from {originalLang} • Show original
      </small>
    </>
  );
}
```

---

## 🧑‍🤝‍🧑 Crowd-Sourced Translation System

### Goals

- Improve translation quality over time
- Reduce reliance on AI
- Leverage bilingual users

---

### Suggestions Table

```ts
{
  id: string,
  translation_id: string,
  suggested_text: string,
  user_id: string,
  votes: number,
  status: "pending" | "approved",
  created_at: Date
}
```

---

### Voting System

- Users can upvote/downvote translations
- Suggestions with high votes replace default translation

### Promotion Logic

```ts
if (suggestion.votes > THRESHOLD) {
  translation.translated_text = suggestion.suggested_text;
  translation.edited_by_user = true;
}
```

---

## ⚡ Performance Optimizations

### 1. Lazy Translation

Only translate content when it enters viewport.

---

### 2. Chunking

Split large text into paragraphs:

```ts
splitIntoParagraphs(text)
→ translate individually
→ recombine
```

Benefits:
- Better cache reuse
- Lower cost

---

### 3. Pre-Translation (Optional)

Trigger when content becomes popular:

```ts
if (views > THRESHOLD) {
  pretranslate(top_languages);
}
```

---

## 💸 Cost Control

### Strategies

- Aggressive caching
- Translate on demand only
- Rate limiting per user
- Tiered translation providers

---

### Example Rate Limit

```ts
if (user.translationRequests > LIMIT) {
  return fallback("Click to translate");
}
```

---

## 🧪 Future Enhancements

- Style-aware translations (tone preservation)
- Author-approved translations
- Translator reputation system
- Multi-language publishing
- Global comment threads (auto-translated)

---

## 🚀 Implementation Phases

### Phase 1 (MVP)
- Language detection
- Translate-on-read
- Translation cache

### Phase 2
- UI toggle (show original)
- Cost controls

### Phase 3
- Crowd suggestions
- Voting system

### Phase 4
- Pre-translation
- Performance optimizations

### Phase 5
- Reputation system
- Official translations

---

## ⚠️ Key Principle

**Never translate everything upfront.**

Always:

> Translate on demand → cache → improve over time

---

## Summary

This system ensures:

- Seamless multilingual experience
- Scalable cost structure
- Continuous quality improvement
- Strong community involvement

It turns translation into a **core platform feature**, not just an add-on.

