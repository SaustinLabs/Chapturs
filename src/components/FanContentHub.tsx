'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import {
  ArrowUpTrayIcon,
  PhotoIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import ImageUpload from '@/components/upload/ImageUpload'

interface WorkOption {
  id: string
  title: string
  description?: string
}

interface ApprovedFanArtCard {
  id: string
  imageUrl: string
  characterName: string
  artistName: string
  workId: string
  workTitle: string
  createdAt: string
}

type ActiveTab = 'browse' | 'submit'

const ART_EMOJI = String.fromCodePoint(0x1f3a8)

export default function FanContentHub() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<ActiveTab>('browse')
  const [loadingBrowse, setLoadingBrowse] = useState(true)
  const [loadingWorks, setLoadingWorks] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [browseError, setBrowseError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [approvedArt, setApprovedArt] = useState<ApprovedFanArtCard[]>([])
  const [works, setWorks] = useState<WorkOption[]>([])
  const [selectedWorkId, setSelectedWorkId] = useState('')
  const [workIdInput, setWorkIdInput] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [artistName, setArtistName] = useState('')
  const [artistLink, setArtistLink] = useState('')
  const [artistHandle, setArtistHandle] = useState('')
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    if (!session?.user?.id) {
      setLoadingBrowse(false)
      setLoadingWorks(false)
      return
    }

    const loadWorks = async () => {
      setLoadingWorks(true)
      try {
        const response = await fetch('/api/works')
        if (!response.ok) {
          throw new Error('Failed to load works.')
        }

        const data = await response.json()
        const nextWorks = data?.data?.works

        if (!Array.isArray(nextWorks)) {
          console.log('Unexpected works response:', data)
          throw new Error('Unexpected works response.')
        }

        setWorks(
          nextWorks.map((work: any) => ({
            id: work.id,
            title: work.title,
            description: work.description,
          }))
        )
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingWorks(false)
      }
    }

    const loadApprovedArt = async () => {
      setLoadingBrowse(true)
      setBrowseError(null)

      try {
        const feedResponse = await fetch('/api/feed?hubMode=reader&limit=10&offset=0')
        if (!feedResponse.ok) {
          throw new Error('Failed to load fan content feed.')
        }

        const feedData = await feedResponse.json()
        const feedItems = feedData?.data?.items

        if (!Array.isArray(feedItems)) {
          console.log('Unexpected fan-content feed response:', feedData)
          throw new Error('Unexpected feed response.')
        }

        const seenWorkIds = new Set<string>()
        const feedWorks = feedItems
          .map((item: any) => item?.work)
          .filter((work: any) => work?.id && !seenWorkIds.has(work.id) && seenWorkIds.add(work.id))

        const workCards = await Promise.all(
          feedWorks.map(async (work: any) => {
            const charactersResponse = await fetch(`/api/works/${work.id}/characters`)
            if (!charactersResponse.ok) {
              return []
            }

            const charactersData = await charactersResponse.json()
            const characters = charactersData?.characters

            if (!Array.isArray(characters)) {
              console.log('Unexpected characters response:', charactersData)
              return []
            }

            const submissionGroups = await Promise.all(
              characters
                .filter((character: any) => character?.allowUserSubmissions)
                .map(async (character: any) => {
                  const submissionsResponse = await fetch(
                    `/api/works/${work.id}/characters/${character.id}/submissions?status=approved`
                  )

                  if (!submissionsResponse.ok) {
                    return []
                  }

                  const submissionsData = await submissionsResponse.json()
                  const submissions = submissionsData?.submissions

                  if (!Array.isArray(submissions)) {
                    console.log('Unexpected fanart submissions response:', submissionsData)
                    return []
                  }

                  return submissions.map((submission: any) => ({
                    id: submission.id,
                    imageUrl: submission.imageUrl,
                    characterName: character.name,
                    artistName: submission.artistName,
                    workId: work.id,
                    workTitle: work.title,
                    createdAt: submission.createdAt,
                  }))
                })
            )

            return submissionGroups.flat()
          })
        )

        setApprovedArt(
          workCards
            .flat()
            .filter((card): card is ApprovedFanArtCard => Boolean(card?.id && card.imageUrl))
            .sort((left, right) => {
              return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
            })
        )
      } catch (error) {
        console.error(error)
        setBrowseError(error instanceof Error ? error.message : 'Failed to load fan content.')
      } finally {
        setLoadingBrowse(false)
      }
    }

    loadWorks()
    loadApprovedArt()
  }, [session?.user?.id])

  const resolvedWorkId = selectedWorkId || workIdInput.trim()
  const selectedWork = useMemo(
    () => works.find((work) => work.id === selectedWorkId) || null,
    [selectedWorkId, works]
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      if (!resolvedWorkId) {
        throw new Error('Choose or enter a work ID.')
      }

      const response = await fetch(`/api/works/${resolvedWorkId}/fanart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          characterName,
          artistName,
          artistLink: artistLink || undefined,
          artistHandle: artistHandle || undefined,
          notes: notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit fan art.')
      }

      setSubmitSuccess(data?.message || 'Fan art submitted successfully.')
      setSelectedWorkId('')
      setWorkIdInput('')
      setCharacterName('')
      setArtistName('')
      setArtistLink('')
      setArtistHandle('')
      setNotes('')
      setImageUrl('')
    } catch (error) {
      console.error(error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit fan art.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!session?.user?.id) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="rounded-3xl border border-gray-700 bg-gray-800 px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-3xl">
            {ART_EMOJI}
          </div>
          <h1 className="mt-6 text-3xl font-bold text-white">Fan Content</h1>
          <p className="mt-3 text-gray-400">
            Sign in to browse approved fan art and submit your own creations.
          </p>
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/fan-content' })}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <SparklesIcon className="h-5 w-5" />
            Sign In to Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Fan Content</h1>
        <p className="mt-2 text-gray-400">
          Browse approved fan art and submit new pieces for your favorite characters.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-700">
        {(['browse', 'submit'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'browse' ? 'Browse' : 'Submit'}
          </button>
        ))}
      </div>

      {activeTab === 'browse' ? (
        <>
          {loadingBrowse ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : browseError ? (
            <div className="text-red-400 text-center py-8">{browseError}</div>
          ) : approvedArt.length === 0 ? (
            <EmptyState
              emoji={ART_EMOJI}
              title="No approved fan art yet"
              description="Once fan art is approved by creators, it will show up here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {approvedArt.map((card) => (
                <Link
                  key={card.id}
                  href={`/story/${card.workId}`}
                  className="group overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 transition hover:border-blue-500/40 hover:bg-gray-800/80"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-900">
                    <Image
                      src={card.imageUrl}
                      alt={`${card.characterName} fan art by ${card.artistName}`}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized
                    />
                  </div>
                  <div className="space-y-3 p-5">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{card.characterName}</h2>
                      <p className="mt-1 text-sm text-gray-400">{card.workTitle}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <UserCircleIcon className="h-4 w-4" />
                      {card.artistName}
                    </div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {new Date(card.createdAt).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-3xl border border-gray-700 bg-gray-800 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Submit Fan Art</h2>
            <p className="mt-2 text-sm text-gray-400">
              The existing API accepts a work-scoped submission, so choose a work or paste its ID.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <ImageUpload
              entityType="fanart"
              onUploadComplete={(image) => setImageUrl(image.urls.optimized)}
              onUploadError={(error) => setSubmitError(error)}
              label="Artwork Upload"
              hint="Upload your fan art first. The optimized URL will be submitted to the work-scoped fan art endpoint."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Work Selector</label>
                <select
                  value={selectedWorkId}
                  onChange={(event) => setSelectedWorkId(event.target.value)}
                  disabled={loadingWorks}
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select one of your works</option>
                  {works.map((work) => (
                    <option key={work.id} value={work.id}>
                      {work.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Or Enter Work ID</label>
                <input
                  type="text"
                  value={workIdInput}
                  onChange={(event) => setWorkIdInput(event.target.value)}
                  placeholder="Paste the parent work ID"
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {selectedWork && (
              <div className="rounded-2xl border border-gray-700 bg-gray-900 p-4">
                <div className="text-sm font-semibold text-white">{selectedWork.title}</div>
                <p className="mt-2 text-sm text-gray-400">
                  {selectedWork.description || 'No description available for this work.'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="Character Name"
                value={characterName}
                onChange={setCharacterName}
                placeholder="Who is featured in the piece?"
              />
              <Field
                label="Artist Name"
                value={artistName}
                onChange={setArtistName}
                placeholder="Credit the artist"
              />
              <Field
                label="Artist Link"
                value={artistLink}
                onChange={setArtistLink}
                placeholder="https://portfolio.example"
              />
              <Field
                label="Artist Handle"
                value={artistHandle}
                onChange={setArtistHandle}
                placeholder="@artist"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Notes</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Add context or a short note for the creator."
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {submitError && <div className="text-red-400 text-center py-2">{submitError}</div>}
            {submitSuccess && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                {submitSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !imageUrl || !characterName || !artistName || !resolvedWorkId}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              Submit Fan Art
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
      />
    </div>
  )
}

function EmptyState({
  emoji,
  title,
  description,
}: {
  emoji: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-3xl border border-gray-700 bg-gray-800 py-16 text-center">
      <div className="text-4xl">{emoji}</div>
      <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </div>
  )
}
