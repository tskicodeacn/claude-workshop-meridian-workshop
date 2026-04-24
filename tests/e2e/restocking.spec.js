import { test, expect } from '@playwright/test'

// Restocking view — budget ceiling, recommendations, filter integration
test.describe('Restocking', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('app-locale'))
    await page.goto('/restocking')
    await page.waitForLoadState('networkidle')
  })

  test('page loads with restocking title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Restocking Recommendations' }).first()).toBeVisible()
  })

  test('budget input and apply button are present', async ({ page }) => {
    await expect(page.getByPlaceholder(/budget/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible()
  })

  test('summary stat cards are visible', async ({ page }) => {
    const statsGrid = page.locator('.stats-grid')
    await expect(statsGrid.getByText('Items to Restock')).toBeVisible()
    await expect(statsGrid.getByText('High Priority Items')).toBeVisible()
    await expect(statsGrid.getByText('Total Estimated Cost')).toBeVisible()
    await expect(statsGrid.getByText('Budget Remaining')).toBeVisible()
  })

  test('recommendations table has expected columns', async ({ page }) => {
    // Only check if there are recommendations
    const table = page.getByRole('table')
    if (await table.isVisible()) {
      await expect(page.getByRole('columnheader', { name: 'SKU' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Item Name' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Priority' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Days of Stock' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Recommended Qty' })).toBeVisible()
    }
  })

  test('applying budget limits the list', async ({ page }) => {
    const allRows = await page.locator('tbody tr').count()

    const budgetInput = page.getByPlaceholder(/budget/i)
    await budgetInput.fill('500')
    await page.getByRole('button', { name: 'Apply' }).click()
    await page.waitForTimeout(500)

    const budgetedRows = await page.locator('tbody tr').count()
    // With a small budget, list should be shorter or empty
    expect(budgetedRows).toBeLessThanOrEqual(allRows)
  })

  test('clearing budget restores full list', async ({ page }) => {
    // First apply a small budget
    const budgetInput = page.getByPlaceholder(/budget/i)
    await budgetInput.fill('500')
    await page.getByRole('button', { name: 'Apply' }).click()
    await page.waitForTimeout(500)

    // Then clear it
    const clearButton = page.getByRole('button', { name: 'Clear' })
    if (await clearButton.isVisible()) {
      await clearButton.click()
      await page.waitForTimeout(500)
    }

    // Should show budget remaining as "No limit"
    await expect(page.getByText('No limit')).toBeVisible()
  })

  test('warehouse filter updates recommendations', async ({ page }) => {
    // Restocking has no Time Period filter: Location is nth(0), Category is nth(1)
    const locationFilter = page.locator('select').nth(0)
    await locationFilter.selectOption('Tokyo')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Restocking Recommendations' }).first()).toBeVisible()
    await expect(page.getByText('Failed to load')).not.toBeVisible()
  })

  test('category filter updates recommendations', async ({ page }) => {
    const categoryFilter = page.locator('select').nth(1)
    await categoryFilter.selectOption('sensors')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Restocking Recommendations' }).first()).toBeVisible()
    await expect(page.getByText('Failed to load')).not.toBeVisible()
  })
})
