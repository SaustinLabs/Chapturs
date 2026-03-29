# Pretext Integration Guide: Chapturs Text Measurement & Layout

This guide explains how to use Pretext in Chapturs for fast, accurate text measurement and layout without DOM reflow.

## What is Pretext?

Pretext is a pure JavaScript/TypeScript library that measures text and calculates line breaks without triggering DOM reflow - one of the most expensive browser operations.

**Key benefits:**
- ✅ Measure text height without DOM measurements
- ✅ Calculate line breaks and widths without rendering
- ✅ Supports all languages and emoji
- ✅ Mobile-friendly responsive layout
- ✅ Canvas/SVG rendering support

## Installation

Pretext is already installed. Check:

```bash
npm list @chenglou/pretext
```

## Core Hooks

Three main hooks are provided in `src/hooks/usePretext.ts`:

### 1. `useMeasureTextHeight()`

Measures text height without requiring a specific width per line.

```typescript
import { useMeasureTextHeight } from '@/hooks/usePretext'

function EditorBlockHeight() {
  const text = "This is some content that might wrap..."
  const { height, lineCount } = useMeasureTextHeight(
    text,
    "16px Inter",      // font specification
    300,              // maxWidth in pixels
    24                // lineHeight in pixels
  )
  
  return (
    <div style={{ height: `${height}px` }}>
      {/* Content renders here with accurate height */}
    </div>
  )
}
```

**Parameters:**
- `text` - String to measure
- `font` - Font spec (e.g., `"16px Arial"`, `"bold italic 18px Georgia"`)
- `maxWidth` - Container width in pixels
- `lineHeight` - Line height in pixels
- `options` - Optional: `{ whiteSpace: 'normal' | 'pre-wrap' }`

**Returns:**
- `height` - Total height in pixels
- `lineCount` - Number of lines

### 2. `useMeasureTextLines()`

Get detailed information about each line (useful for mobile text boxes).

```typescript
import { useMeasureTextLines } from '@/hooks/usePretext'

function MobileMessage() {
  const lines = useMeasureTextLines(
    "Hello! How are you?",
    "14px Inter",
    250,      // maxWidth
    20        // lineHeight
  )
  
  // lines = { height: 40, lineCount: 2, lines: [
  //   { text: "Hello! How are you?", width: 145, start: {...}, end: {...} }
  // ]}
  
  return (
    <div style={{ width: Math.max(...lines.lines.map(l => l.width)) + 16 }}>
      {/* Shrink-wrapped container */}
    </div>
  )
}
```

**Returns:**
- `height` - Total height
- `lineCount` - Number of lines
- `lines` - Array of `{ text, width, start, end }` for each line

### 3. `useLayoutNextLine()`

For advanced layouts (e.g., text flowing around floated images).

```typescript
import { useLayoutNextLine } from '@/hooks/usePretext'
import type { LayoutCursor } from '@chenglou/pretext'

function TextAroundImage() {
  const layoutNextLine = useLayoutNextLine(
    fullText,
    fontSpec
  )
  
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let y = 0
  
  while (true) {
    // Dynamically adjust width as text wraps around image
    const width = y < imageBottom ? columnWidth - imageWidth : columnWidth
    const line = layoutNextLine(cursor, width)
    
    if (!line) break  // No more text
    
    renderLine(line.text, y)
    cursor = line.end
    y += lineHeight
  }
}
```

## Integration Examples

### Example 1: Auto-Height Editor (RichTextEditor)

```typescript
import { useMeasureTextHeight } from '@/hooks/usePretext'

function ChaptursEditorBlock({ content, onChange }) {
  const { height } = useMeasureTextHeight(
    content.replace(/<[^>]*>/g, ''),  // Strip HTML tags
    "16px Inter",
    600,
    24
  )
  
  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        style={{ 
          minHeight: `${Math.max(height + 20, 100)}px`
        }}
      />
    </div>
  )
}
```

### Example 2: Mobile Chat UI (MobileTextBox)

The `MobileTextBox` component already uses Pretext:

```typescript
import MobileTextBox from '@/components/MobileTextBox'

function ChatMessage() {
  return (
    <MobileTextBox
      content="Hey! How's it going?"
      platform="ios"
      fontSize={16}
      lineHeight={24}
      maxWidth={280}
    />
  )
}
```

### Example 3: Responsive Reader (ChaptursReader)

```typescript
import { useMeasureTextLines } from '@/hooks/usePretext'

function ResponsiveChapterText({ text, containerWidth }) {
  const measurement = useMeasureTextLines(
    text,
    "18px Georgia",
    containerWidth,
    28  // 1.5x line height for reading
  )
  
  return (
    <div style={{ height: `${measurement.height}px` }}>
      <p>{text}</p>
    </div>
  )
}
```

## Font String Format

Pretext uses browser canvas font specification format:

```
[style] [weight] [size] [family]

Examples:
- "16px Inter"
- "bold 18px Arial"
- "italic 14px Georgia"
- "bold italic 20px Courier New"
```

**Important**: Font string must exactly match your CSS declarations. If your CSS says:

```css
.prose-text {
  font: 18px "Helvetica Neue";
  font-weight: bold;
}
```

Use: `"bold 18px Helvetica Neue"` in Pretext.

## Performance Tips

1. **Memoize Font Specs**: Cache font strings to avoid recalculation
   ```typescript
   const EDITOR_FONT = useMemo(() => "16px Inter", [])
   ```

2. **Batch Measurements**: Don't measure every keystroke
   ```typescript
   useEffect(() => {
     const timer = setTimeout(() => recalculate(), 300)
     return () => clearTimeout(timer)
   }, [content])
   ```

3. **Clear Cache When Fonts Change**:
   ```typescript
   import { useClearPretextCache } from '@/hooks/usePretext'
   
   const clearCache = useClearPretextCache()
   
   useEffect(() => {
     // User changed font setting
     clearCache()
   }, [fontSize, fontFamily])
   ```

## Unicode & Language Support

Pretext handles:
- ✅ Latin (English, Spanish, French, etc.)
- ✅ CJK (Chinese, Japanese, Korean)
- ✅ Arabic & RTL languages
- ✅ Emoji (including multi-codepoint emoji)
- ✅ Mixed-bidi text

**Example:**
```typescript
useMeasureTextHeight(
  "English 中文 العربية 🚀",
  "16px Inter",
  300,
  24
)
// Works perfectly!
```

## Caveats & Limitations

1. **system-ui font is unsafe** on macOS. Use named fonts instead:
   ```typescript
   // ❌ Don't use
   "16px system-ui"
   
   // ✅ Use instead
   "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial"
   ```

2. **Canvas measurement accuracy**: Different browsers may have slight measurement differences (usually < 1px). Test across target browsers.

3. **Line-breaking rules**: Pretext implements standard word-break behavior:
   - `word-break: normal` 
   - `overflow-wrap: break-word`
   - Very narrow widths still break at grapheme boundaries

## Debugging

### Enable Cache Stats

```typescript
import { useGetPretextCacheStats } from '@/hooks/usePretext'

function DebugPanel() {
  const getCacheStats = useGetPretextCacheStats()
  
  useEffect(() => {
    console.log('Pretext Cache:', getCacheStats())
  }, [])
}
```

### Common Issues

**Issue**: Measurement doesn't match rendered text
- **Solution**: Verify font string exactly matches CSS
- Check for `system-ui` font (use specific family instead)

**Issue**: Memory usage grows over time
- **Solution**: Call `useClearPretextCache()` when font changes
- Pretext caches by `text|font|whitespace` combination

**Issue**: Measurements are off by a few pixels
- **Solution**: Normal! Add small buffer: `height + 4`

## Next Steps

1. ✅ Review current editor implementations in `src/components/`
2. ✅ Replace DOM height calculations with `useMeasureTextHeight()`
3. ✅ Update responsive reader layouts
4. ✅ Test on mobile devices

---

**Reference**: [https://github.com/chenglou/pretext](https://github.com/chenglou/pretext)
