import { test, expect } from '@playwright/test'

test.describe('Backend Integration Animations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-backend')
  })

  test('should load backend integration demo page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Backend Integration & Performance Demo')
    
    // Check that tabs are present
    await expect(page.getByRole('button', { name: 'Backend Integration' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Animation State' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Viewport Optimization' })).toBeVisible()
  })

  test('should show TanStack Query integration features', async ({ page }) => {
    // Should be on Backend Integration tab by default
    // Look for the main content section, not the feature summary
    const mainSection = page.locator('[data-testid="integration-tab"], div').filter({ hasText: 'TanStack Query Integration' }).first()
    await expect(mainSection).toBeVisible()
    
    // Test animated query section specifically
    await expect(page.getByRole('heading', { name: 'Animated Query', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Refetch Data' })).toBeVisible()
    
    // Test animated mutation section specifically  
    await expect(page.getByRole('heading', { name: 'Animated Mutation', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible()
  })

  test('should interact with mutation demo', async ({ page }) => {
    // Find the mutation input and button with more specific selectors
    const input = page.getByPlaceholder(/edit data to save/i)
    const saveButton = page.getByRole('button', { name: 'Save Changes' })
    
    await expect(input).toBeVisible()
    await expect(saveButton).toBeVisible()
    
    // Type in the input
    await input.fill('Test data for mutation')
    
    // Click save and verify animation appears
    await saveButton.click()
    
    // Should show loading state
    await expect(saveButton).toBeDisabled()
    
    // Wait for operation to complete
    await expect(saveButton).toBeEnabled({ timeout: 8000 })
  })

  test('should switch between tabs', async ({ page }) => {
    // Click Animation State tab
    await page.getByRole('button', { name: 'Animation State' }).click()
    await expect(page.getByRole('heading', { name: 'Global Animation State Manager' })).toBeVisible()
    
    // Click Viewport Optimization tab
    await page.getByRole('button', { name: 'Viewport Optimization' }).click()
    await expect(page.getByRole('heading', { name: 'Viewport Optimization Demo' })).toBeVisible()
    
    // Go back to Backend Integration
    await page.getByRole('button', { name: 'Backend Integration' }).click()
    await expect(page.getByRole('heading', { name: 'Animated Query', exact: true })).toBeVisible()
  })

  test('should show animation state management', async ({ page }) => {
    // Switch to Animation State tab
    await page.getByRole('button', { name: 'Animation State' }).click()
    
    // Test priority buttons
    await expect(page.getByRole('button', { name: 'Add High Priority' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Normal Priority' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Low Priority' })).toBeVisible()
    
    // Click a priority button and check state changes
    await page.getByRole('button', { name: 'Add High Priority' }).click()
    
    // Should see state updates
    await expect(page.locator('text=Active:').first()).toBeVisible()
    await expect(page.locator('text=Queued:').first()).toBeVisible()
  })

  test('should show performance analytics', async ({ page }) => {
    // Switch to Animation State tab
    await page.getByRole('button', { name: 'Animation State' }).click()
    
    // Check performance metrics section
    await expect(page.getByRole('heading', { name: 'Performance Analytics' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Metrics' })).toBeVisible()
    
    // Performance elements should be visible
    await expect(page.locator('text=Total Animations:').first()).toBeVisible()
    await expect(page.locator('text=Performance Score:').first()).toBeVisible()
  })

  test('should handle viewport optimization', async ({ page }) => {
    // Switch to Viewport Optimization tab
    await page.getByRole('button', { name: 'Viewport Optimization' }).click()
    
    // Should see the first animation item specifically
    await expect(page.getByRole('heading', { name: 'Animation Item #1', exact: true })).toBeVisible()
    await expect(page.locator('text=This animation only runs when visible').first()).toBeVisible()
    
    // Scroll down to trigger more animations
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2)
    })
    
    // Should see multiple animation items (count all items)
    const itemCount = await page.getByRole('heading', { name: /Animation Item #\d+/ }).count()
    expect(itemCount).toBe(20)
  })

  test('should show optimistic updates demo', async ({ page }) => {
    // Should see optimistic updates section - use first() to avoid strict mode violation
    await expect(page.getByRole('heading', { name: 'Optimistic Updates' }).first()).toBeVisible()
    
    const input = page.getByPlaceholder(/type to see optimistic updates/i)
    const button = page.getByRole('button', { name: 'Save with Optimistic Update' })
    
    await expect(input).toBeVisible()
    await expect(button).toBeVisible()
    
    // Test optimistic update
    await input.fill('Optimistic test data')
    await button.click()
    
    // Should see the data reflected immediately
    await expect(page.locator('text=Current Data:').first()).toBeVisible()
  })

  test('should show background sync demo', async ({ page }) => {
    // Should see background sync section
    await expect(page.getByRole('heading', { name: 'Background Sync' })).toBeVisible()
    
    // Check sync status elements
    await expect(page.locator('text=Is Syncing:').first()).toBeVisible()
    await expect(page.locator('text=Last Sync:').first()).toBeVisible()
    
    // Test manual sync
    const forceSyncButton = page.getByRole('button', { name: 'Force Sync Now' })
    await expect(forceSyncButton).toBeVisible()
    await forceSyncButton.click()
  })

  test('should show feature summary', async ({ page }) => {
    // Scroll down to feature summary
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    
    // Check feature summary section
    await expect(page.getByRole('heading', { name: '🚀 New Features Implemented' })).toBeVisible()
    
    // Check feature cards - use more specific selectors
    await expect(page.locator('.grid').last().getByRole('heading', { name: /TanStack Query Integration/ })).toBeVisible()
    await expect(page.locator('.grid').last().getByRole('heading', { name: /Viewport Optimization/ })).toBeVisible()
    await expect(page.locator('.grid').last().getByRole('heading', { name: /Global State Management/ })).toBeVisible()
    await expect(page.locator('.grid').last().getByRole('heading', { name: /Performance Optimization/ })).toBeVisible()
    await expect(page.locator('.grid').last().getByRole('heading', { name: /Optimistic Updates/ })).toBeVisible()
    await expect(page.locator('.grid').last().getByRole('heading', { name: /Analytics & Monitoring/ })).toBeVisible()
  })

  test('should handle error simulation', async ({ page }) => {
    // Check error simulation checkbox
    const errorCheckbox = page.getByRole('checkbox', { name: /simulate error/i })
    await expect(errorCheckbox).toBeVisible()
    
    // Enable error simulation
    await errorCheckbox.check()
    
    // Trigger a refetch to see error handling
    const refetchButton = page.getByRole('button', { name: 'Refetch Data' })
    await refetchButton.click()
    
    // Should show error state - look for any error indicator
    await expect(page.locator('text=Error').or(page.locator('text=Failed')).or(page.locator('text=error')).first()).toBeVisible({ timeout: 10000 })
  })
})