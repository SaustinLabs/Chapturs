// Extracted validation/authorization logic for PATCH collaborator revenueShare
// Used for isolated regression testing

const ALLOWED_ROLES = ['editor', 'contributor']

/**
 * Validates and authorizes a PATCH collaborator update
 * @param {Object} params
 * @param {Object} params.session - Auth session (must have .user.id)
 * @param {string} params.dbUserId - User ID from session
 * @param {Object} params.work - Work object (must have .authorId)
 * @param {Object} params.body - Request body (userId, role, revenueShare)
 * @returns {Object} { ok: true } or { error, status }
 */
function validatePatchCollaborator({ session, dbUserId, work, body }) {
  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 }
  }
  if (!body.userId) {
    return { error: 'userId is required', status: 400 }
  }
  if (body.role !== undefined && !ALLOWED_ROLES.includes(body.role)) {
    return { error: 'Invalid role. Allowed roles: editor, contributor', status: 400 }
  }
  if (body.revenueShare !== undefined) {
    if (typeof body.revenueShare !== 'number' || isNaN(body.revenueShare)) {
      return { error: 'revenueShare must be a number', status: 400 }
    }
    if (body.revenueShare < 0 || body.revenueShare > 100) {
      return { error: 'revenueShare must be between 0 and 100', status: 400 }
    }
  }
  if (!work || work.authorId !== dbUserId) {
    return { error: 'Only the author can update collaborators', status: 403 }
  }
  return { ok: true }
}

module.exports = { validatePatchCollaborator }