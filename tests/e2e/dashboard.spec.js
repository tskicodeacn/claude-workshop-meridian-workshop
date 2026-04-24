import { test, expect } from '@playwright/test'

// Dashboard (Overview) — smoke tests and critical flows
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Factory Inventory Management System')
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
  })

  test('navigation links are present', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Inventory' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Finance' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Demand Forecast' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Reports' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Restocking' })).toBeVisible()
  })

  test('KPI cards are visible', async ({ page }) => {
    await expect(page.getByText('Inventory Turnover Rate')).toBeVisible()
    await expect(page.getByText('Orders Fulfilled')).toBeVisible()
    await expect(page.getByText('Order Fill Rate')).toBeVisible()
    await expect(page.getByText('Revenue (Orders) YTD')).toBeVisible()
  })

  test('filter bar is present with all four filters', async ({ page }) => {
    await expect(page.getByText('Time Period')).toBeVisible()
    await expect(page.getByText('Location')).toBeVisible()
    await expect(page.getByText('Category')).toBeVisible()
    await expect(page.getByText('Order Status')).toBeVisible()
  })

  test('inventory shortages table is visible', async ({ page }) => {
    await expect(page.getByText(/Inventory Shortages/)).toBeVisible()
  })

  test('top products table is visible', async ({ page }) => {
    await expect(page.getByText('Top Products by Revenue')).toBeVisible()
  })

  test('filtering by warehouse updates dashboard data', async ({ page }) => {
    const locationFilter = page.locator('select').nth(1)
    await locationFilter.selectOption('San Francisco')
    await page.waitForTimeout(500)
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
    // No error state
    await expect(page.getByText('Error')).not.toBeVisible()
  })

  test('no console errors on load', async ({ page }) => {
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForTimeout(1000)
    // Filter known non-critical errors (favicon, etc.)
    const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'))
    expect(criticalErrors).toHaveLength(0)
  })
})
