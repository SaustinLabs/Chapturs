type PatchBody = {
  userId?: string
  role?: string
  revenueShare?: number
}

const ALLOWED_ROLES = ['editor', 'contributor'] as const

type ValidateInput = {
  dbUserId: string
  work: { authorId: string } | null
  body: PatchBody
}

type ValidateResult =
  | { ok: true }
  | { ok: false; status: number; error: string }

export function validatePatchCollaborator(input: ValidateInput): ValidateResult {
  const { dbUserId, work, body } = input
  const { userId, role, revenueShare } = body

  if (!userId) {
    return { ok: false, status: 400, error: 'userId is required' }
  }

  if (!work || work.authorId !== dbUserId) {
    return { ok: false, status: 403, error: 'Only the author can update collaborators' }
  }

  if (role !== undefined && !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return { ok: false, status: 400, error: 'Invalid role. Allowed roles: editor, contributor' }
  }

  if (revenueShare !== undefined) {
    if (typeof revenueShare !== 'number' || Number.isNaN(revenueShare)) {
      return { ok: false, status: 400, error: 'revenueShare must be a number' }
    }
    if (revenueShare < 0 || revenueShare > 100) {
      return { ok: false, status: 400, error: 'revenueShare must be between 0 and 100' }
    }
  }

  if (role === undefined && revenueShare === undefined) {
    return { ok: false, status: 400, error: 'No fields to update' }
  }

  return { ok: true }
}
