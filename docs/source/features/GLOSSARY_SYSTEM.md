# Glossary System - Chapter-Aware Definitions

## Overview
The glossary system allows authors to define terms, characters, places, and concepts that can have **different meanings across chapters**. This creates a dynamic reading experience where definitions evolve with the story.

## How It Works

### For Authors (Creating Definitions)

1. **While Writing**: Select any text in the editor
2. **Click "Define"**: A purple button appears when text is selected
3. **Add Definition**: Enter the definition for that term at this point in the story
4. **Save**: The term is saved with the current chapter number

### Database Structure

#### GlossaryEntry (Main Entry)
```typescript
{
  id: string
  workId: string
  term: string              // "Elena", "The Blade", "Academy"
  definition: string        // Current/latest definition
  type: string             // "term", "character", "place", "item", "concept"
  category: string?        // Optional grouping
  chapterIntroduced: int?  // First chapter where mentioned
  aliases: string?         // JSON: ["El", "Lady Elena"]
  metadata: string?        // JSON: { role: "protagonist", age: 23 }
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### GlossaryDefinitionVersion (Chapter-Specific Meanings)
```typescript
{
  id: string
  glossaryEntryId: string
  definition: string
  fromChapter: int         // Definition applies from this chapter...
  toChapter: int?          // ...until this chapter (null = ongoing)
  notes: string?           // "Elena learns the truth about her past"
  createdAt: DateTime
}
```

## Example: Character Evolution

```typescript
// Chapter 1
{
  term: "Elena",
  definition: "A young swordswoman training at the Academy",
  type: "character",
  chapterIntroduced: 1,
  versions: [
    {
      definition: "A young swordswoman training at the Academy",
      fromChapter: 1,
      toChapter: 50
    }
  ]
}

// Chapter 51 - Major revelation
{
  versions: [
    {
      definition: "A young swordswoman training at the Academy",
      fromChapter: 1,
      toChapter: 50
    },
    {
      definition: "The lost heir to the throne, disguised as a student",
      fromChapter: 51,
      toChapter: null  // Ongoing
    }
  ]
}
```

## For Readers

### Reading Experience
- Hover over defined terms to see their **current definition**
- Definition shown is appropriate for **the chapter being read**
- Terms link to full glossary with evolution timeline
- Character profiles show development across the story

### Preview Tab
- See all defined terms for the current chapter
- Grouped by type: Characters, Places, Terms, Items
- Shows when each term was introduced
- Click to navigate to first mention

## API Endpoints

### POST `/api/works/[id]/glossary`
Create a new glossary entry
```json
{
  "term": "The Blade",
  "definition": "An ancient sword passed down through generations",
  "category": "item",
  "aliases": ["The Sword", "Heirloom Blade"],
  "chapters": [5]  // Current chapter
}
```

### GET `/api/works/[id]/glossary`
Get all glossary entries for a work
```json
{
  "success": true,
  "entries": [
    {
      "id": "...",
      "term": "Elena",
      "definition": "...",
      "type": "character",
      "chapterIntroduced": 1,
      "definitions": [...]  // All versions
    }
  ]
}
```

### GET `/api/works/[id]/glossary/[term]?chapter=X`
Get term definition for specific chapter
- Returns the definition that was active in that chapter
- Includes evolution timeline

## Future Enhancements

1. **Auto-Detection**: AI identifies potential terms to define
2. **Smart Suggestions**: Suggest when to update definitions based on plot
3. **Reader Annotations**: Readers can add their own notes to terms
4. **Definition Diffs**: Show what changed between versions
5. **Character Relationship Graph**: Visual connections between characters
6. **Timeline View**: See term evolution across the entire story

## Implementation Status

✅ **Completed**:
- Database schema with chapter-aware definitions
- Basic save/load functionality
- Sidebar integration
- Editor modal for adding terms

🚧 **In Progress**:
- Chapter-specific definition retrieval
- Term highlighting in preview
- Character profiles
- Definition version management UI

📋 **Planned**:
- Reader-facing glossary page
- Term linking in published stories
- Auto-suggest for undefined terms
- Bulk import/export
