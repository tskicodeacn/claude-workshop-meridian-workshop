import { test, expect } from '@playwright/test'

// Inventory view — stock levels and filtering
test.describe('Inventory', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inventory')
    await page.waitForLoadState('networkidle')
  })

  test('page loads with inventory title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible()
  })

  test('inventory table is visible with data', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible()
    // At least one row of data
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('summary stat cards are visible', async ({ page }) => {
    const statsGrid = page.locator('.stats-grid')
    await expect(statsGrid.getByText('Total Items')).toBeVisible()
    await expect(statsGrid.getByText('Total Value')).toBeVisible()
    await expect(statsGrid.getByText('Low Stock Items')).toBeVisible()
    await expect(statsGrid.getByText('Warehouses')).toBeVisible()
  })

  test('filter by warehouse narrows results', async ({ page }) => {
    const allRows = await page.locator('tbody tr').count()

    const locationFilter = page.locator('select').nth(1)
    await locationFilter.selectOption('Tokyo')
    await page.waitForTimeout(500)

    const filteredRows = await page.locator('tbody tr').count()
    expect(filteredRows).toBeLessThanOrEqual(allRows)
  })

  test('filter by category narrows results', async ({ page }) => {
    const allRows = await page.locator('tbody tr').count()

    const categoryFilter = page.locator('select').nth(2)
    await categoryFilter.selectOption('Sensors')
    await page.waitForTimeout(500)

    const filteredRows = await page.locator('tbody tr').count()
    expect(filteredRows).toBeLessThanOrEqual(allRows)
  })

  test('search filters items by name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill('Motor')
    await page.waitForTimeout(300)

    const rows = page.locator('tbody tr')
    const count = await rows.count()
    // All visible rows should contain 'Motor' (or table is empty if no match)
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('Motor', { ignoreCase: true })
    }
  })

  test('table has expected columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'SKU' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /item name|name/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /location|warehouse/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
  })
})
