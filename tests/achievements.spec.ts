import { expect, test } from '@playwright/test'

/**
 * E2E tests for the achievements block on the profile page (/profile/[username]).
 *
 * The AchievementsBlock component renders inside the profile page and calls
 * /api/achievements/[userId] to fetch data. The profile page first calls
 * /api/profile/[username] to resolve the userId.
 *
 * All tests use page.route() to intercept both API calls so no real DB data is
 * required. Tests run in the mobile viewports configured in playwright.config.ts
 * (Pixel 7 + iPhone 13).
 */

// ---------------------------------------------------------------------------
// Shared mock payloads
// ---------------------------------------------------------------------------

const MOCK_USER_ID = 'user_test_001'
const MOCK_USERNAME = 'test-writer'
const PROFILE_URL = `/profile/${MOCK_USERNAME}`

const MOCK_PROFILE_RESPONSE = {
  user: {
    id: MOCK_USER_ID,
    username: MOCK_USERNAME,
    displayName: 'Test Writer',
    bio: null,
    avatar: null,
    isPremium: false,
    featuredCommentCount: 0,
  },
  works: [],
  profile: null,
}

const MOCK_ACHIEVEMENTS_EMPTY = {
  achievements: [],
  totalPoints: 0,
  level: null,
  stats: { total: 0, featured: 0 },
}

const MOCK_ACHIEVEMENTS_WITH_BADGE = {
  achievements: [
    {
      id: 'ua_001',
      userId: MOCK_USER_ID,
      achievementId: 'ach_001',
      awardedAt: '2026-04-14T00:00:00.000Z',
      isFeatured: false,
      achievement: {
        id: 'ach_001',
        key: 'first_chapter',
        title: 'First Chapter',
        description: 'Published your first chapter',
        badgeIcon: '✍️',
        pointValue: 50,
        tier: 'bronze',
        category: 'author',
        isActive: true,
      },
    },
  ],
  totalPoints: 50,
  level: { level: 1, title: 'Newcomer', badge: '🌱', minPoints: 0 },
  stats: { total: 1, featured: 0 },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Intercepts both the profile and achievements API calls with the given payloads. */
async function mockProfileAndAchievements(
  page: import('@playwright/test').Page,
  achievementsPayload: object
) {
  await page.route(`**/api/profile/${MOCK_USERNAME}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PROFILE_RESPONSE),
    })
  })

  await page.route(`**/api/achievements/${MOCK_USER_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(achievementsPayload),
    })
  })
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe('Achievements block — profile page', () => {

  // ── Test 1: Guest view ────────────────────────────────────────────────────
  test('guest view: profile page loads and achievements block is present with no console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await mockProfileAndAchievements(page, MOCK_ACHIEVEMENTS_EMPTY)
    await page.goto(PROFILE_URL, { waitUntil: 'networkidle' })

    // The achievements section should be in the DOM
    const achievementsSection = page.locator('section').filter({
      has: page.locator('text=/Achievements|No achievements/i'),
    })
    await expect(achievementsSection.first()).toBeVisible()

    // No uncaught console errors from the achievements block (filter known Next.js hydration noise)
    const achievementErrors = consoleErrors.filter(
      (e) => e.toLowerCase().includes('achievement') || e.toLowerCase().includes('undefined')
    )
    expect(achievementErrors).toHaveLength(0)
  })

  // ── Test 2: Empty state ───────────────────────────────────────────────────
  test('empty state: shows "No achievements yet" message when user has no achievements', async ({ page }) => {
    await mockProfileAndAchievements(page, MOCK_ACHIEVEMENTS_EMPTY)
    await page.goto(PROFILE_URL, { waitUntil: 'networkidle' })

    // AchievementsBlock renders this text when achievements array is empty
    await expect(page.getByText('No achievements yet', { exact: false })).toBeVisible()
  })

  test('empty state: shows the trophy emoji placeholder in the empty state', async ({ page }) => {
    await mockProfileAndAchievements(page, MOCK_ACHIEVEMENTS_EMPTY)
    await page.goto(PROFILE_URL, { waitUntil: 'networkidle' })

    // The component renders 🏆 as the empty-state placeholder
    await expect(page.getByText('🏆')).toBeVisible()
  })

  // ── Test 3: Achievement badge renders with correct tier styling ───────────
  test('achievement badge: renders the badge icon when achievements exist', async ({ page }) => {
    await mockProfileAndAchievements(page, MOCK_ACHIEVEMENTS_WITH_BADGE)
    await page.goto(PROFILE_URL, { waitUntil: 'networkidle' })

    // The badge icon emoji should be visible
    await expect(page.getByRole('img', { name: 'First Chapter' })).toBeVisible()
  })

  test('achievement badge: bronze tier badge has the amber ring class applied', async ({ page }) => {
    await mockProfileAndAchievements(page, MOCK_ACHIEVEMENTS_WITH_BADGE)
    await page.goto(PROFILE_URL, { waitUntil: 'networkidle' })

    // AchievementBadge uses ring-amber-600 for bronze tier (see AchievementBadge.tsx tierRing map)
    const bronzeBadge = page.locator('[class*="ring-amber-600"]').first()
    await expect(bronzeBadge).toBeVisible()
  })

  test('achievement badge: level display shows when user has a level tier', async ({ page }) => {
    await mockProfileAndAchievements(page, MOCK_ACHIEVEMENTS_WITH_BADGE)
    await page.goto(PROFILE_URL, { waitUntil: 'networkidle' })

    // AchievementsBlock header shows "Level N — Title" when level is non-null
    await expect(page.getByText(/Level 1\s*—\s*Newcomer/i)).toBeVisible()
  })

  test('achievement badge: total points are displayed in the header', async ({ page }) => {
    await mockProfileAndAchievements(page, MOCK_ACHIEVEMENTS_WITH_BADGE)
    await page.goto(PROFILE_URL, { waitUntil: 'networkidle' })

    await expect(page.getByText(/50\s*points/i)).toBeVisible()
  })

  // ── Test 4: Own profile visibility toggle (auth-dependent) ───────────────
  test.skip('own profile: visibility toggle button is shown only to the profile owner', async ({ page }) => {
    /**
     * SKIPPED — requires an authenticated session.
     *
     * What this test would verify:
     *   1. Sign in as MOCK_USERNAME (or a user whose session.user.name matches the profile).
     *   2. Navigate to /profile/test-writer — isOwnProfile resolves to true.
     *   3. Assert the "Shown on profile" / "Hidden" toggle button is visible in the
     *      achievements block header (AchievementsBlock renders it only when isOwnProfile=true).
     *   4. Click the button — assert text changes between "Shown on profile" and "Hidden".
     *   5. Verify PATCH /api/achievements/[userId]/visibility was called with the correct payload.
     *
     * To enable: add a storageState fixture with a valid session cookie, or use
     *   test.use({ storageState: 'playwright/.auth/user.json' }) and implement
     *   the auth setup in tests/auth.setup.ts.
     */
    void page
  })

})
