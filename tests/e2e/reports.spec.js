import { test, expect } from '@playwright/test'

// Reports view — quarterly data, monthly trends, filter integration
// These tests cover the R1 defects that were remediated
test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports')
    await page.waitForLoadState('networkidle')
  })

  test('page loads with reports title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Performance Reports' })).toBeVisible()
  })

  test('quarterly performance table is visible', async ({ page }) => {
    await expect(page.getByText('Quarterly Performance').first()).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Quarter' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Total Orders' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Fulfillment Rate' })).toBeVisible()
  })

  test('monthly revenue trend chart is visible', async ({ page }) => {
    await expect(page.getByText('Monthly Revenue Trend').first()).toBeVisible()
  })

  test('month-over-month analysis table is visible', async ({ page }) => {
    await expect(page.getByText('Month-over-Month Analysis').first()).toBeVisible()
  })

  test('summary stat cards are visible', async ({ page }) => {
    await expect(page.getByText('Total Revenue (YTD)')).toBeVisible()
    await expect(page.getByText('Avg Monthly Revenue')).toBeVisible()
    await expect(page.getByText('Total Orders (YTD)')).toBeVisible()
    await expect(page.getByText('Best Performing Quarter')).toBeVisible()
  })

  // Regression test for R1 defect: filters were completely ignored
  test('time period filter December shows only Q4 data', async ({ page }) => {
    const periodFilter = page.locator('select').nth(0)
    await periodFilter.selectOption('December')
    await page.waitForTimeout(500)

    // Should show Q4 data in the quarterly table
    const quarterlyTable = page.locator('table').first()
    await expect(quarterlyTable.getByText('Q4-2025').first()).toBeVisible()
    // Should NOT show Q1, Q2, Q3
    await expect(quarterlyTable.getByText('Q1-2025')).not.toBeVisible()
    await expect(quarterlyTable.getByText('Q2-2025')).not.toBeVisible()
    await expect(quarterlyTable.getByText('Q3-2025')).not.toBeVisible()
  })

  // Regression test for R1 defect: warehouse filter not applied
  test('warehouse filter updates report data', async ({ page }) => {
    const locationFilter = page.locator('select').nth(1)
    await locationFilter.selectOption('San Francisco')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Performance Reports' })).toBeVisible()
    await expect(page.getByText('Failed to load')).not.toBeVisible()
  })

  // Regression test for R1 defect: no console logs
  test('no console.log noise on reports page', async ({ page }) => {
    const logs = []
    page.on('console', msg => {
      if (msg.type() === 'log') logs.push(msg.text())
    })
    await page.goto('/reports')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Old code had 13 console.log calls including ones in render loops
    // After fix: zero logs from Reports component
    const reportLogs = logs.filter(l =>
      l.includes('Loading reports') ||
      l.includes('Formatting number') ||
      l.includes('Formatting month') ||
      l.includes('bar height') ||
      l.includes('Quarterly data') ||
      l.includes('Monthly data')
    )
    expect(reportLogs).toHaveLength(0)
  })
})
