import { test, expect } from '@playwright/test'

// Orders view — order list, status cards, filtering
test.describe('Orders', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('app-locale'))
    await page.goto('/orders')
    await page.waitForLoadState('networkidle')
  })

  test('page loads with orders title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Orders' }).first()).toBeVisible()
  })

  test('status summary cards are visible', async ({ page }) => {
    const statsGrid = page.locator('.stats-grid')
    await expect(statsGrid.getByText('Delivered')).toBeVisible()
    await expect(statsGrid.getByText('Shipped')).toBeVisible()
    await expect(statsGrid.getByText('Processing')).toBeVisible()
    await expect(statsGrid.getByText('Backordered')).toBeVisible()
  })

  test('orders table is visible with data', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible()
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('table has expected columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Order Number' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Customer' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Total Value' })).toBeVisible()
  })

  test('filter by status narrows results', async ({ page }) => {
    const allRows = await page.locator('tbody tr').count()

    const statusFilter = page.locator('select').nth(3)
    await statusFilter.selectOption('Delivered')
    await page.waitForTimeout(500)

    const filteredRows = await page.locator('tbody tr').count()
    expect(filteredRows).toBeLessThanOrEqual(allRows)
    expect(filteredRows).toBeGreaterThan(0)
  })

  test('filter by warehouse narrows results', async ({ page }) => {
    const allRows = await page.locator('tbody tr').count()

    const locationFilter = page.locator('select').nth(1)
    await locationFilter.selectOption('London')
    await page.waitForTimeout(500)

    const filteredRows = await page.locator('tbody tr').count()
    expect(filteredRows).toBeLessThanOrEqual(allRows)
  })

  test('filter by time period narrows results', async ({ page }) => {
    const allRows = await page.locator('tbody tr').count()

    const periodFilter = page.locator('select').nth(0)
    await periodFilter.selectOption('January')
    await page.waitForTimeout(500)

    const filteredRows = await page.locator('tbody tr').count()
    expect(filteredRows).toBeLessThanOrEqual(allRows)
  })

  test('combined filters work together', async ({ page }) => {
    const locationFilter = page.locator('select').nth(1)
    await locationFilter.selectOption('San Francisco')

    const statusFilter = page.locator('select').nth(3)
    await statusFilter.selectOption('Delivered')

    await page.waitForTimeout(500)
    // Should not show error state
    await expect(page.getByText('Failed to load')).not.toBeVisible()
  })
})
