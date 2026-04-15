/**
 * Regression tests for collaborator revenue share PATCH API
 * Covers: validation, authorization, and success update
 */


const { validatePatchCollaborator } = require('../lib/collaborationPatchValidation');

function makeReq(body) {
  return {
    json: async () => body,
  }
}

describe('validatePatchCollaborator', () => {
  const workId = 'work1';
  const ownerId = 'owner1';
  const collabId = 'collab1';
  const work = { id: workId, authorId: ownerId };
  const session = { user: { id: ownerId } };
  const dbUserId = ownerId;

  it('rejects out-of-range revenueShare', () => {
    const body = { userId: collabId, revenueShare: 150 };
    const result = validatePatchCollaborator({ session, dbUserId, work, body });
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/revenueShare.*between 0 and 100/i);
  });

  it('rejects PATCH if not owner', () => {
    const body = { userId: collabId, revenueShare: 10 };
    const notOwnerSession = { user: { id: 'notowner' } };
    const notOwnerId = 'notowner';
    const result = validatePatchCollaborator({ session: notOwnerSession, dbUserId: notOwnerId, work, body });
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/only the author/i);
  });

  it('accepts valid update', () => {
    const body = { userId: collabId, revenueShare: 25 };
    const result = validatePatchCollaborator({ session, dbUserId, work, body });
    expect(result.ok).toBe(true);
  });
});