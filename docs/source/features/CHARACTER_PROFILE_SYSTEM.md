# Character Profile System

## Overview

The Character Profile System extends Chapturs' editor with comprehensive character tracking and management capabilities. Similar to the existing glossary system, it provides chapter-aware character development tracking with rich metadata support.

## Features

### 1. Character Profile Creation

Authors can create detailed character profiles directly from the editor:

- **Text Selection**: Highlight a character name in the editor
- **Quick Access**: Click the "Character" button that appears alongside the glossary button
- **Comprehensive Form**: Fill in extensive character details including:
  - Basic info (name, aliases, role, first appearance)
  - Visual details (profile image, physical description, age, height)
  - Background (backstory, personality traits, motivations)
  - Development tracking (character arc notes, author notes)

### 2. Character Highlighting

In preview mode, character names are automatically highlighted:

- **Green Highlights**: Character names appear with green dotted underlines (vs purple for glossary terms)
- **Hover Tooltips**: Mini character cards appear on hover showing:
  - Character name
  - Role (protagonist, antagonist, etc.)
  - Profile image (if available)
  - Physical description snippet

### 3. Chapter-Aware Character Development

Characters can evolve throughout the story:

- **Version Tracking**: Character details can change between chapters
- **Timeline Support**: Track character development across the narrative
- **Historical Context**: View how characters were described at different points

### 4. Character Relationships

Track connections between characters:

- **Relationship Types**: Family, friend, enemy, ally, mentor, rival, etc.
- **Relationship Notes**: Document the nature and history of relationships
- **Chapter Context**: Track when relationships were established or revealed

### 5. EditorSidebar Integration

The Characters tab in the sidebar displays:

- **Character List**: All characters in the current work
- **Quick Info**: Name, role, first appearance, physical description
- **Profile Images**: Visual representation of each character
- **Easy Access**: Click to view or edit character details

## Database Schema

### CharacterProfile

```typescript
{
  id: string
  workId: string
  name: string
  aliases: string[]              // ["El", "Lady Elena"]
  role: string                   // "protagonist", "antagonist", etc.
  firstAppearance: number        // Chapter where first mentioned
  imageUrl: string
  physicalDescription: string
  age: string
  height: string
  appearanceNotes: string
  backstory: string
  personalityTraits: string[]    // ["brave", "loyal", "stubborn"]
  motivations: string
  characterArc: string           // Development notes
  developmentTimeline: object    // JSON tracking changes
  authorNotes: string            // Private notes
  metadata: object               // Additional JSON data
}
```

### CharacterRelationship

```typescript
{
  id: string
  characterId: string
  relatedCharacterId: string
  relationshipType: string       // "family", "friend", "enemy", etc.
  notes: string
  fromChapter: number           // When relationship started/revealed
}
```

### CharacterVersion

```typescript
{
  id: string
  characterId: string
  physicalDescription: string
  backstory: string
  personalityTraits: string[]
  motivations: string
  developmentNotes: string      // What changed
  fromChapter: number           // Version applies from this chapter
  toChapter: number             // Until this chapter (null = ongoing)
}
```

## API Endpoints

### Create Character Profile

```http
POST /api/works/{workId}/characters
Content-Type: application/json

{
  "name": "Elena Stormblade",
  "aliases": ["El", "The Blade"],
  "role": "protagonist",
  "firstAppearance": 1,
  "physicalDescription": "Tall warrior with silver hair and piercing blue eyes",
  "age": "25",
  "height": "5'10\"",
  "backstory": "Former royal guard turned wandering knight...",
  "personalityTraits": ["brave", "determined", "haunted by past"],
  "motivations": "Seeking redemption for failing to protect the royal family"
}
```

### Get All Characters (Chapter-Aware)

```http
GET /api/works/{workId}/characters?chapter=5
```

Returns characters with their state at chapter 5.

### Update Character Profile

```http
PUT /api/works/{workId}/characters/{characterId}
Content-Type: application/json

{
  "name": "Elena Stormblade",
  "physicalDescription": "Battle-scarred warrior...",
  "currentChapter": 10
}
```

If `currentChapter` is provided, creates a new character version.

### Delete Character Profile

```http
DELETE /api/works/{workId}/characters/{characterId}
```

Cascades to delete all versions and relationships.

### Add Character Relationship

```http
POST /api/works/{workId}/characters/{characterId}/relationships
Content-Type: application/json

{
  "relatedCharacterId": "character-id-2",
  "relationshipType": "mentor",
  "notes": "The old master who trained Elena in swordsmanship",
  "fromChapter": 3
}
```

### Get Character Relationships

```http
GET /api/works/{workId}/characters/{characterId}/relationships
```

## UI Components

### CharacterProfileModal

Full-featured form for creating/editing character profiles:

- **Tabs/Sections**: Organized into logical groups (Basic, Visual, Background, Notes)
- **Dynamic Lists**: Add/remove aliases and personality traits
- **Rich Input**: Text areas for longer content like backstory
- **Validation**: Ensures required fields (name) are filled
- **Auto-Population**: Pre-fills name from selected text

### CharacterTooltip

Hover preview component:

- **Mini Card**: Shows character name, role, image, and description snippet
- **Green Styling**: Distinct from glossary tooltips (purple)
- **Smart Positioning**: Adjusts to viewport boundaries
- **Smooth Animations**: Fade in/out effects

### CharacterCard

Detailed view component with two modes:

- **Compact Mode**: List item with thumbnail, name, role, and key details
- **Full Mode**: Expanded card with all information
- **Actions**: Edit and delete buttons
- **Visual Hierarchy**: Clear organization of information

### HtmlWithHighlights

Unified highlighting component:

- **Dual Support**: Highlights both glossary terms and characters
- **Priority System**: Characters take priority over glossary terms
- **Alias Support**: Matches character aliases as well as primary names
- **SSR Safe**: Only highlights client-side to avoid hydration errors
- **Performance**: Optimized regex matching with sorted patterns

## Usage Examples

### Adding a Character in the Editor

1. Write your story in the editor
2. Select a character name (e.g., "Elena")
3. Click the green "Character" button that appears
4. Fill in the character profile form:
   - Name: Elena Stormblade
   - Role: Protagonist
   - Add aliases: "El", "The Blade"
   - Physical description: "Tall warrior with silver hair..."
   - Add personality traits: "brave", "determined"
   - Write backstory
5. Save the profile

### Viewing Characters in Preview

1. Switch to Preview mode in the editor
2. Character names will be highlighted with green underlines
3. Hover over any character name to see their mini card
4. Green highlights differentiate characters from purple glossary terms

### Managing Characters in Sidebar

1. Open the sidebar (click the toggle button)
2. Switch to the "Characters" tab
3. View all characters in your story
4. See character thumbnails, roles, and first appearances
5. Click on a character to view full details (future enhancement)

## Styling Guide

### Character Highlights

- **Border**: 2px dotted green (`border-green-500`)
- **Text Color**: Green 600 (`text-green-600 dark:text-green-400`)
- **Hover**: Solid border on hover
- **Font Weight**: Medium for emphasis

### Glossary Highlights (for comparison)

- **Border**: 2px dotted blue (`border-blue-500`)
- **Text Color**: Blue 600 (`text-blue-600 dark:text-blue-400`)

### Tooltips

- **Background**: Dark gray-900
- **Text**: White
- **Shadow**: Extra large
- **Max Width**: 320px (80 rem)

## Best Practices

### For Authors

1. **Create Early**: Add character profiles when characters first appear
2. **Use Aliases**: Include common nicknames and variations
3. **Update Development**: Add new versions when characters change significantly
4. **Track Relationships**: Document connections between characters
5. **Private Notes**: Use author notes for plot-relevant details readers shouldn't know yet

### For Developers

1. **Chapter Awareness**: Always pass `currentChapter` when creating/updating
2. **Version Control**: Create new versions for significant character changes
3. **Relationship Bidirectionality**: Consider adding reverse relationships automatically
4. **Image Optimization**: Compress character images for faster loading
5. **Search/Filter**: Add search functionality for works with many characters

## Technical Considerations

### Performance

- **Lazy Loading**: Character data loaded only when needed
- **Caching**: Characters cached at chapter level
- **Debouncing**: Limit API calls during rapid changes
- **Regex Optimization**: Sorted patterns prevent redundant matches

### SSR Compatibility

- **Client-Side Only**: Highlighting only occurs after mount
- **Hydration Safe**: No mismatches between server and client renders
- **Progressive Enhancement**: Works without JavaScript (basic display)

### Security

- **Authorization**: All endpoints verify work ownership
- **Input Validation**: Sanitize all user input
- **SQL Injection**: Use parameterized queries (raw SQL with Prisma)
- **XSS Prevention**: Escape user-generated content in tooltips

## Future Enhancements

### Planned Features

1. **Character Relationship Graph**: Visual network diagram
2. **Character Timeline**: Interactive timeline of character development
3. **Character Templates**: Pre-filled templates for common archetypes
4. **Character Groups**: Tag characters by faction, family, etc.
5. **Character Stats**: Track quantifiable attributes (power level, etc.)
6. **Character Voice**: Record character speech patterns and dialects
7. **Character Gallery**: Browse all characters with filtering and sorting
8. **Export/Import**: Share character profiles between works
9. **AI Assistance**: Suggest character traits and relationships
10. **Reader Annotations**: Let readers add their own character notes

### Integration Opportunities

- **Plot Tracker**: Link characters to plot points
- **Scene Builder**: Select characters involved in scenes
- **Dialogue Assistant**: Auto-suggest speaker based on context
- **World Building**: Connect characters to locations and organizations
- **Analytics**: Track character screen time and mentions

## Migration Guide

If you have existing character data in glossary entries:

1. Export glossary entries marked as type "character"
2. Use the character creation API with the exported data
3. Update character version history if definitions changed
4. Verify highlighting works correctly
5. Delete or reassign old glossary entries

## Troubleshooting

### Characters Not Highlighting

- Ensure characters are loaded (check browser console)
- Verify character names match exactly (case-insensitive)
- Check that preview mode is active
- Clear cache and reload page

### Tooltips Not Appearing

- Check z-index conflicts with other UI elements
- Verify JavaScript is enabled
- Ensure character data includes required fields
- Test in different browsers

### Chapter-Aware Data Not Working

- Confirm `chapter` parameter is passed correctly
- Verify character versions exist for the chapter
- Check database queries return expected results
- Review API response format

### Performance Issues

- Limit number of characters (consider pagination)
- Optimize character images (compress, lazy load)
- Reduce tooltip content length
- Consider debouncing hover events

## Support

For issues or questions about the character profile system:

1. Check this documentation first
2. Review the glossary system (similar architecture)
3. Inspect browser console for errors
4. Check database schema and migrations
5. Review API endpoint responses

## Related Systems

- **Glossary System**: Similar architecture for term definitions
- **Plot Tracker**: (Planned) Link characters to plot events
- **World Building**: (Planned) Connect characters to locations
- **Reader Experience**: Character information for readers
