import { test, expect } from '@playwright/test';

test.describe('Navigation and Routing', () => {
  test('should navigate between all pages correctly', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    // Navigate to Dashboard
    await page.locator('nav a[href="/dashboard"]').click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Marketing Dashboard');
    
    // Navigate to Create Content
    await page.locator('nav a[href="/create"]').click();
    await expect(page).toHaveURL('/create');
    await expect(page.locator('h1')).toContainText('Create Professional Marketing Content');
    
    // Navigate to Agent Workflow (should show error without ID)
    await page.locator('nav a[href="/workflow"]').click();
    await expect(page).toHaveURL('/workflow');
    await expect(page.locator('text=No workflow ID provided')).toBeVisible();
    
    // Navigate to Quality Control (should show error without ID)
    await page.locator('nav a[href="/quality"]').click();
    await expect(page).toHaveURL('/quality');
    await expect(page.locator('text=No workflow ID provided')).toBeVisible();
    
    // Navigate back to Home
    await page.locator('nav a[href="/"]').click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Agentic Marketing');
  });

  test('should highlight active navigation link', async ({ page }) => {
    // Test Home page active state
    await page.goto('/');
    await expect(page.locator('nav a[href="/"]')).toHaveClass(/text-orange-400/);
    
    // Test Dashboard page active state
    await page.goto('/dashboard');
    await expect(page.locator('nav a[href="/dashboard"]')).toHaveClass(/text-orange-400/);
    
    // Test Create page active state
    await page.goto('/create');
    await expect(page.locator('nav a[href="/create"]')).toHaveClass(/text-orange-400/);
  });

  test('should show mobile navigation correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Navigation should still be visible on mobile
    await expect(page.locator('nav')).toBeVisible();
    
    // Brand logo should be visible
    await expect(page.locator('text=AgenticMarketing')).toBeVisible();
  });

  test('should handle direct URL navigation', async ({ page }) => {
    // Test direct navigation to each page
    const pages = [
      { url: '/', heading: 'Agentic Marketing' },
      { url: '/dashboard', heading: 'Marketing Dashboard' },
      { url: '/create', heading: 'Create Professional Marketing Content' }
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await expect(page).toHaveURL(pageInfo.url);
      await expect(page.locator('h1')).toContainText(pageInfo.heading);
    }
  });

  test('should maintain navigation state when going back/forward', async ({ page }) => {
    await page.goto('/');
    
    // Navigate forward through pages
    await page.locator('nav a[href="/dashboard"]').click();
    await page.locator('nav a[href="/create"]').click();
    
    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('nav a[href="/dashboard"]')).toHaveClass(/text-orange-400/);
    
    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL('/create');
    await expect(page.locator('nav a[href="/create"]')).toHaveClass(/text-orange-400/);
  });

  test('should show brand logo and maintain consistent header', async ({ page }) => {
    const pages = ['/', '/dashboard', '/create'];
    
    for (const url of pages) {
      await page.goto(url);
      
      // Check brand logo is present
      await expect(page.locator('text=AgenticMarketing')).toBeVisible();
      
      // Check navigation is consistent
      await expect(page.locator('nav a[href="/"]')).toContainText('Home');
      await expect(page.locator('nav a[href="/dashboard"]')).toContainText('Dashboard');
      await expect(page.locator('nav a[href="/create"]')).toContainText('Create Content');
      await expect(page.locator('nav a[href="/workflow"]')).toContainText('Agent Workflow');
      await expect(page.locator('nav a[href="/quality"]')).toContainText('Quality Control');
    }
  });

  test('should handle non-existent pages with 404', async ({ page }) => {
    // Navigate to a non-existent page
    const response = await page.goto('/non-existent-page');
    
    // Should return 404 status
    expect(response?.status()).toBe(404);
  });
});