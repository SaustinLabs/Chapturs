import GutenbergImportForm from '@/components/admin/GutenbergImportForm'

export default function ImportPage() {
  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Import from Project Gutenberg</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Paste a Gutenberg ebook URL. The import fetches the text, splits it into chapters,
        generates a glossary, extracts characters, and queues quality assessment.
        Takes ~30-60 seconds for large novels.
      </p>
      <GutenbergImportForm />
    </div>
  )
}
