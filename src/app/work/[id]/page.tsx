import { redirect } from 'next/navigation'

// Legacy route 窶・all story traffic moved to /story/[id]
export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/story/${id}`)
}
