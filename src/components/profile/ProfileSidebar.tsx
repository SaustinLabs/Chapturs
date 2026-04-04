'use client'

import { useState } from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'

interface ProfileSidebarProps {
  profileImage?: string
  displayName: string
  username: string
  bio?: string
  isOwner?: boolean
  isPremium?: boolean
  featuredCommentCount?: number
  onEdit?: () => void
}

/**
 * ProfileSidebar - v0.1
 * Left sidebar section containing profile photo and bio
 * Width is ~50% of featured content area (3 cols vs 5 cols in 12-col grid)
 */
export default function ProfileSidebar({
  profileImage,
  displayName,
  username,
  bio,
  isOwner = false,
  isPremium = false,
  featuredCommentCount = 0,
  onEdit
}: ProfileSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <div className="relative group">
        <div className="aspect-square rounded-lg overflow-hidden bg-gray-800 border-2 border-gray-700">
          {profileImage ? (
            <img
              src={profileImage}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl text-gray-600">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {isOwner && onEdit && (
          <button
            onClick={onEdit}
            className="absolute top-2 right-2 p-2 bg-gray-900/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit profile photo"
          >
            <PencilIcon className="w-4 h-4 text-gray-300" />
          </button>
        )}
      </div>

      {/* Display Name & Username */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100 mb-1">
          {displayName}
        </h1>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-400">@{username}</p>
          {isPremium && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium">
              ✦ Premium
            </span>
          )}
          {featuredCommentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium" title="Comments featured by story authors">
              ✦ {featuredCommentCount >= 50 ? '50+' : featuredCommentCount} featured {featuredCommentCount === 1 ? 'comment' : 'comments'}
            </span>
          )}
        </div>
      </div>

      {/* Bio Section */}
      <div className="relative group">
        {bio ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{bio}</ReactMarkdown>
          </div>
        ) : isOwner ? (
          <div className="text-sm text-gray-500 italic">
            No bio yet. Click edit to add one.
          </div>
        ) : null}
        
        {isOwner && onEdit && bio && (
          <button
            onClick={onEdit}
            className="absolute top-0 right-0 p-1.5 bg-gray-900/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit bio"
          >
            <PencilIcon className="w-3 h-3 text-gray-300" />
          </button>
        )}
      </div>

      {/* Action Buttons (for non-owners) */}
      {!isOwner && (
        <div className="space-y-2">
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Follow
          </button>
          <button className="w-full px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium">
            Message
          </button>
        </div>
      )}
    </div>
  )
}
