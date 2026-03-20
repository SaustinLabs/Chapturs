# Creator Editor System Documentation

## Overview

The Chapturs Creator Editor is a comprehensive content creation platform that combines Google Docs-style rich text editing with advanced storytelling tools. It provides creators with professional-grade tools for writing novels, articles, comics, and poetry.

## Key Features

### 1. Rich Text Editor (CreatorEditor.tsx)
- **Google Docs-style Interface**: Familiar editing experience with comprehensive toolbar
- **Tiptap Integration**: Industry-leading rich text editor with React/TypeScript support
- **Advanced Formatting**: Typography, alignment, colors, fonts, lists, tables
- **Auto-save Functionality**: Real-time saving to prevent data loss
- **Chapter Navigation**: Sidebar with chapter organization and quick navigation
- **Word Count**: Real-time statistics for chapters and overall work
- **Responsive Design**: Optimized for desktop and mobile editing

### 2. Storytelling Tools
- **Glossary System**: Chapter-aware definitions with hover tooltips
- **Character Profiles**: Integrated character management with quick access
- **Term Highlighting**: Automatic highlighting of defined terms in text
- **Context-Aware Definitions**: Different definitions for different chapters
- **Category Organization**: Group terms by type (characters, locations, magic, etc.)

### 3. File Upload System (AdvancedUploader.tsx)
- **Multi-format Support**: .docx, .txt, .md, .pdf, .zip files
- **Drag & Drop Interface**: Intuitive file upload experience
- **Progress Tracking**: Real-time upload progress with detailed feedback
- **Auto-parsing**: Intelligent content extraction from various file formats
- **Batch Processing**: Upload multiple files simultaneously
- **Scheduling System**: Schedule content publication with calendar integration

### 4. Format-Aware UI
- **Novel Mode**: Chapter-based organization with book-style navigation
- **Article Mode**: Section-based structure for non-fiction content
- **Comic Mode**: Panel and page organization for visual storytelling
- **Poetry Mode**: Verse and stanza management for poetic works
- **Adaptive Interface**: UI adapts based on selected content format

## Architecture

### Components Structure

```
src/components/
├── CreatorEditor.tsx          # Main rich text editor with Tiptap
├── AdvancedUploader.tsx       # File upload and processing system
└── [other components...]

src/app/creator/editor/
└── page.tsx                   # Main editor page integrating all components

src/app/api/
├── works/
│   ├── route.ts              # Work creation and retrieval
│   └── [id]/
│       ├── sections/
│       │   └── route.ts      # Chapter/section management
│       └── glossary/
│           └── route.ts      # Glossary term management
```

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Rich Text**: Tiptap (33k+ GitHub stars, most recommended for React 2024)
- **Icons**: Lucide React (modern, consistent icon library)
- **Database**: Prisma with SQLite/PostgreSQL support
- **Authentication**: NextAuth.js with Google OAuth
- **File Processing**: Native browser APIs with format-specific parsers

## API Endpoints

### Works Management

#### POST /api/works
Create a new work/project.

**Request Body:**
```json
{
  "title": "string",
  "description": "string", 
  "formatType": "novel|article|comic|poetry",
  "genres": ["string"],
  "tags": ["string"],
  "maturityRating": "G|PG|PG13|R|M",
  "status": "draft|published|completed"
}
```

**Response:**
```json
{
  "success": true,
  "work": {
    "id": "string",
    "title": "string",
    // ... work object
  }
}
```

#### GET /api/works
Retrieve user's works.

**Response:**
```json
{
  "success": true,
  "works": [
    {
      "id": "string",
      "title": "string",
      // ... work objects
    }
  ]
}
```

### Sections/Chapters Management

#### POST /api/works/[id]/sections
Create a new section/chapter.

**Request Body:**
```json
{
  "title": "string",
  "content": {}, // Tiptap JSON document
  "wordCount": "number",
  "status": "draft|published"
}
```

#### GET /api/works/[id]/sections
Retrieve work sections.

### Glossary Management

#### POST /api/works/[id]/glossary
Create/update glossary entry.

**Request Body:**
```json
{
  "term": "string",
  "definition": "string",
  "category": "string",
  "aliases": ["string"],
  "chapters": ["number"]
}
```

#### GET /api/works/[id]/glossary
Retrieve work glossary.

## Usage Examples

### Basic Editor Usage

```typescript
import CreatorEditor from '@/components/CreatorEditor'

function MyEditorPage() {
  const [content, setContent] = useState('')
  
  return (
    <CreatorEditor
      content={content}
      onChange={setContent}
      workId="work-123"
      formatType="novel"
    />
  )
}
```

### File Upload Integration

```typescript
import AdvancedUploader from '@/components/AdvancedUploader'

function MyUploadPage() {
  const handleUploadComplete = (results) => {
    console.log('Upload completed:', results)
  }
  
  return (
    <AdvancedUploader
      onUploadComplete={handleUploadComplete}
      supportedFormats={['docx', 'txt', 'md']}
      maxFileSize={10 * 1024 * 1024} // 10MB
    />
  )
}
```

### Glossary System Usage

```typescript
// Adding a glossary term
const glossaryEntry = {
  term: 'Mana',
  definition: 'Magical energy that flows through all living things',
  category: 'magic',
  aliases: ['magical energy', 'life force'],
  chapters: [1, 3, 5] // Appears in chapters 1, 3, and 5
}

// The system automatically highlights "Mana" in the editor
// and shows the definition on hover
```

## Interface Types

### Work Interface
```typescript
interface Work {
  id: string
  title: string
  description: string
  author: Author
  formatType: 'novel' | 'article' | 'comic' | 'poetry'
  coverImage?: string
  status: 'draft' | 'published' | 'completed'
  maturityRating: 'G' | 'PG' | 'PG13' | 'R' | 'M'
  genres: string[]
  tags: string[]
  statistics: WorkStatistics
  glossary: GlossaryEntry[]
  sections: Section[]
  createdAt: string
  updatedAt: string
}
```

### Section Interface
```typescript
interface Section {
  id: string
  title: string
  content: JSONContent // Tiptap document
  wordCount: number
  status: 'draft' | 'published'
  order: number
  createdAt: string
  updatedAt: string
}
```

### Glossary Entry Interface
```typescript
interface GlossaryEntry {
  id: string
  term: string
  definition: string
  category: string
  aliases: string[]
  chapters: number[]
  workId: string
  createdAt: string
  updatedAt: string
}
```

## Installation & Setup

### 1. Dependencies Installation
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-typography @tiptap/extension-text-align
npm install @tiptap/extension-color @tiptap/extension-font-family
npm install @tiptap/extension-character-count @tiptap/extension-image
npm install @tiptap/extension-link @tiptap/extension-table
npm install lucide-react
```

### 2. Environment Variables
```env
NEXTAUTH_SECRET=your-secret-key
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
DATABASE_URL=your-database-url
```

### 3. Database Setup
```bash
npx prisma migrate dev
npx prisma generate
```

## Performance Optimizations

### 1. Editor Performance
- **Lazy Loading**: Components load only when needed
- **Debounced Auto-save**: Prevents excessive database calls
- **Virtual Scrolling**: Handles large documents efficiently
- **Code Splitting**: Tiptap extensions loaded on demand

### 2. File Upload Optimization
- **Chunk Upload**: Large files uploaded in chunks
- **Progress Tracking**: Real-time feedback for user experience
- **Format Detection**: Automatic MIME type validation
- **Memory Management**: Files processed without excessive memory usage

### 3. Glossary System Optimization
- **Caching**: Terms cached for fast lookup
- **Selective Highlighting**: Only highlight in current chapter view
- **Lazy Tooltips**: Definitions loaded on demand

## Security Considerations

### 1. Authentication
- **JWT Tokens**: Secure session management
- **OAuth Integration**: Google authentication for user verification
- **Session Validation**: All API endpoints validate user sessions

### 2. File Upload Security
- **File Type Validation**: Strict MIME type checking
- **Size Limits**: Configurable file size restrictions
- **Virus Scanning**: Optional integration with security services
- **Storage Isolation**: User files stored in isolated directories

### 3. Content Security
- **XSS Prevention**: Tiptap content sanitization
- **SQL Injection**: Prisma ORM protection
- **CSRF Protection**: NextAuth.js built-in protection

## Testing

### 1. Component Testing
```bash
npm run test:components
```

### 2. API Testing
```bash
npm run test:api
```

### 3. Integration Testing
```bash
npm run test:integration
```

## Troubleshooting

### Common Issues

#### Tiptap Import Errors
```typescript
// Correct imports
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

// Note: BubbleMenu and FloatingMenu should be imported from @tiptap/react
import { BubbleMenu, FloatingMenu } from '@tiptap/react'
```

#### Database Connection Issues
```bash
# Check database connection
npx prisma db pull

# Reset database if needed
npx prisma migrate reset
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Future Enhancements

### Planned Features
1. **Collaborative Editing**: Real-time collaboration with multiple authors
2. **Version Control**: Git-style versioning for content
3. **Export Options**: PDF, EPUB, HTML export functionality
4. **Advanced Analytics**: Detailed writing statistics and insights
5. **Plugin System**: Custom extensions for specialized workflows
6. **Cloud Storage**: Integration with Google Drive, Dropbox, etc.
7. **AI Integration**: Writing assistance and grammar checking
8. **Mobile App**: Companion mobile app for writing on the go

### Contributing
Contributions are welcome! Please see CONTRIBUTING.md for guidelines.

### License
This project is licensed under the MIT License - see LICENSE.md for details.
