import { expect, test } from '@playwright/test'

test.describe('mobile smoke', () => {
  test('home feed renders and has no horizontal overflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await expect(page.locator('body')).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(() => {
      const doc = document.documentElement
      return doc.scrollWidth > doc.clientWidth + 1
    })

    expect(hasHorizontalOverflow).toBeFalsy()
  })

  test('creator editor route is reachable on mobile and not shifted off-screen', async ({ page }) => {
    await page.goto('/creator/editor', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('body')).toBeVisible()

    const viewport = page.viewportSize()
    if (!viewport) {
      test.skip(true, 'Viewport not available from browser context')
      return
    }

    const layoutBox = await page.locator('div.fixed.inset-0').first().boundingBox()
    if (!layoutBox) {
      test.skip(true, 'Editor shell not rendered in this auth state')
      return
    }

    expect(layoutBox.x).toBeLessThanOrEqual(1)
    expect(layoutBox.width).toBeGreaterThan(viewport.width * 0.9)
  })

  test('reader chapter mobile controls render when chapter route is available', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const chapterLink = page
      .locator('a[href*="/story/"][href*="/chapter/"]')
      .first()

    if ((await chapterLink.count()) === 0) {
      test.skip(true, 'No chapter links found from home feed in this dataset')
      return
    }

    await chapterLink.click()
    await page.waitForLoadState('domcontentloaded')

    const glossaryButton = page.getByRole('button', { name: 'Glossary' })
    await expect(glossaryButton).toBeVisible()

    await glossaryButton.click()
    await expect(page.getByText('Story Glossary')).toBeVisible()
  })
})
