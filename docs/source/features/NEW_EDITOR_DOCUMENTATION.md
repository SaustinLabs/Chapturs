# New Chapturs Editor System

## Overview
The new Chapturs editor is a complete redesign featuring a Notion/Ghost-style block-based interface with advanced storytelling capabilities. It replaces the fragmented `CreatorEditor` and `ExperimentalEditor` components with a unified, extensible architecture.

## Key Features

### 1. Block-Based Editing
- **Flexible Content Blocks**: Prose, headings, dialogue, chat simulations, phone UI, narration boxes, dividers, and images
- **Drag & Drop** (coming soon): Reorder blocks with visual feedback
- **Keyboard Shortcuts**: Quick block creation and navigation
- **Live Preview**: Toggle between edit and preview modes instantly

### 2. Environment Blocks
Special block types for immersive storytelling:

#### Prose Block
Traditional paragraph text with alignment and styling options.

#### Dialogue Block
Script-style character dialogue with speaker labels and emotion indicators:
```
ALICE (angry): You can't be serious!
BOB (defensive): I had no choice.
```

#### Chat Block
Messaging platform simulations supporting:
- Discord
- WhatsApp
- SMS
- Telegram
- Slack
- Generic chat

Features platform-specific styling, avatars, timestamps, and read receipts.

#### Phone UI Block
Full phone screen simulation with:
- iOS/Android/Generic styles
- Status bar (time, battery, signal)
- iMessage/SMS interface
- Sent vs received message styling
- Read receipts and timestamps

#### Narration Block
Narrator commentary with three variants:
- **Box**: Traditional boxed narration
- **Overlay**: Dark overlay style (cinematic)
- **Inline**: Italicized inline commentary

### 3. Content Format (.chapt)
Stories are stored as JSON documents with:
- **Metadata**: Title, author, language, word count, status
- **Content**: Array of typed blocks
- **Translations**: Sentence-level translations per block
- **Comments**: Inline reader feedback
- **Edit Suggestions**: Community typo/grammar corrections
- **Glossary**: Chapter-specific term definitions

Example structure:
```json
{
  "type": "chapter",
  "version": "1.0.0",
  "metadata": {
    "id": "chapter-123",
    "title": "The Beginning",
    "author": { "id": "user-456", "name": "Jane Doe" },
    "language": "en",
    "wordCount": 2500,
    "status": "published"
  },
  "content": [
    {
      "id": "block-1",
      "type": "prose",
      "text": "It was a dark and stormy night..."
    },
    {
      "id": "block-2",
      "type": "chat",
      "platform": "discord",
      "messages": [
        { "user": "Alice", "text": "Did you hear that?" },
        { "user": "Bob", "text": "Yeah... what was that?" }
      ]
    }
  ]
}
```

## Components

### ChaptursEditor (`src/components/ChaptursEditor.tsx`)
Main editor component with:
- Block management (add, delete, move, update)
- Auto-save functionality (2-second debounce)
- Word count tracking
- Preview mode toggle
- Toolbar with save/publish actions

**Props:**
```typescript
interface ChaptursEditorProps {
  workId: string
  chapterId?: string
  initialDocument?: ChaptDocument
  onSave?: (document: ChaptDocument) => Promise<void>
  onPublish?: (document: ChaptDocument) => Promise<void>
}
```

### Block Editors (`src/components/BlockEditors.tsx`)
Specialized editors for each block type:
- `ChatBlockEditor`: Chat/messaging simulation
- `PhoneBlockEditor`: Phone screen UI
- `DialogueBlockEditor`: Character dialogue
- `NarrationBlockEditor`: Narrator commentary

Each supports:
- Edit mode with full controls
- Preview mode with platform-accurate rendering
- Translate mode (for future translation system)

## Type Definitions (`src/types/chapt.ts`)

### Core Types
- `BlockType`: Union of all supported block types
- `ContentBlock`: Union of all block interfaces
- `ChaptDocument`: Complete chapter structure
- `EditorState`: Editor UI state management

### Translation Types
- `SentenceTranslation`: Community-submitted translations
- `TranslationSuggestion`: Proposed translation improvements

### Collaboration Types
- `EditSuggestion`: Reader-submitted typo/grammar fixes
- `BlockComment`: Inline comment threads

## Usage

### Basic Example
```tsx
import ChaptursEditor from '@/components/ChaptursEditor'

function MyPage() {
  const handleSave = async (doc) => {
    await fetch('/api/chapters', {
      method: 'POST',
      body: JSON.stringify(doc)
    })
  }

  return (
    <ChaptursEditor
      workId="my-work-123"
      onSave={handleSave}
    />
  )
}
```

### With Initial Content
```tsx
const initialDoc: ChaptDocument = {
  type: 'chapter',
  version: '1.0.0',
  metadata: {
    id: 'chapter-1',
    title: 'Chapter 1',
    // ... other metadata
  },
  content: [
    { id: '1', type: 'prose', text: 'Once upon a time...' }
  ]
}

<ChaptursEditor
  workId="my-work"
  chapterId="chapter-1"
  initialDocument={initialDoc}
  onSave={handleSave}
  onPublish={handlePublish}
/>
```

## Testing

A demo page is available at `/test/editor` for testing all block types and features.

```bash
npm run dev
# Navigate to http://localhost:3000/test/editor
```

## Roadmap

### Phase 1 (Completed)
- ✅ Block-based content model (.chapt format)
- ✅ ChaptursEditor component with auto-save
- ✅ Environment blocks (chat, phone, dialogue, narration)
- ✅ Preview mode

### Phase 2 (In Progress)
- 🔄 Translation system database schema
- 🔄 Translation API endpoints
- 🔄 Dual-language reader UI

### Phase 3 (Upcoming)
- ⏳ Reader experience with pacing animations
- ⏳ Inline comments and edit suggestions
- ⏳ Quote-sharing and bookmarking

### Phase 4 (Future)
- ⏳ Preserve visual novel mode as block type
- ⏳ Preserve worldbuilding mode
- ⏳ Preserve branching story mode
- ⏳ Migration from old editor format
- ⏳ Deprecate CreatorEditor/ExperimentalEditor

## Performance Considerations

- **Auto-save**: Debounced to prevent excessive API calls
- **Word Count**: Calculated efficiently on save, not on every keystroke
- **Block Rendering**: Each block is memoized to prevent unnecessary re-renders
- **Large Documents**: Virtual scrolling (planned for documents >100 blocks)

## Accessibility

- Keyboard navigation between blocks
- ARIA labels on all interactive elements
- Proper heading hierarchy
- Focus management

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Dependencies

- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- Lucide React (icons)
- Next.js 14+ (App Router)

## Migration Guide

For users currently using `CreatorEditor` or `ExperimentalEditor`:

1. **Import new component**:
   ```tsx
   import ChaptursEditor from '@/components/ChaptursEditor'
   ```

2. **Convert existing content** to `.chapt` format (migration script coming soon)

3. **Update save handlers** to work with `ChaptDocument` type

4. **Test thoroughly** with existing content

## Contributing

When adding new block types:

1. Define the block interface in `src/types/chapt.ts`
2. Add to `ContentBlock` union type
3. Create editor component in `src/components/BlockEditors.tsx`
4. Add to switch statement in `BlockRenderer`
5. Update `createBlockByType` helper
6. Update `calculateWordCount` helper
7. Add to `BlockTypeMenu`
8. Write tests

## License

Part of the Chapturs platform. All rights reserved.
