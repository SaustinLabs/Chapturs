export interface CommentUser {
  id: string
  username: string
  displayName: string | null
  avatar: string | null
}

export interface Comment {
  id: string
  workId: string
  sectionId: string | null
  userId: string
  content: string
  parentId: string | null
  isEdited: boolean
  isPinned: boolean
  isHidden: boolean
  editedAt: string | null
  createdAt: string
  updatedAt: string
  user: CommentUser
  likeCount: number
  replyCount: number
  hasMoreReplies?: boolean
  replies?: Comment[]
  likes?: { userId: string }[]
  reactions?: {
    emoji: string
    users: CommentUser[]
  }[]
}
