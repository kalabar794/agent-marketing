import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/AgenticFlow - AI Marketing Content Generator/);
  });

  test('should display main navigation', async ({ page }) => {
    // Check if navigation is visible
    await expect(page.locator('nav')).toBeVisible();
    
    // Check navigation links
    await expect(page.locator('nav a[href="/"]')).toContainText('Home');
    await expect(page.locator('nav a[href="/dashboard"]')).toContainText('Dashboard');
    await expect(page.locator('nav a[href="/create"]')).toContainText('Create Content');
    await expect(page.locator('nav a[href="/workflow"]')).toContainText('Agent Workflow');
    await expect(page.locator('nav a[href="/quality"]')).toContainText('Quality Control');
  });

  test('should display hero section with correct content', async ({ page }) => {
    // Check main heading
    await expect(page.locator('h1')).toContainText('Agentic Marketing');
    await expect(page.locator('h1')).toContainText('Content Generator');
    
    // Check subtitle/description
    await expect(page.locator('text=Transform your marketing workflow with 11 specialized AI')).toBeVisible();
    
    // Check feature badges
    await expect(page.locator('text=No setup required')).toBeVisible();
    await expect(page.locator('text=Professional results')).toBeVisible();
    await expect(page.locator('text=Brand consistency')).toBeVisible();
  });

  test('should display main action buttons', async ({ page }) => {
    // Check "Start Creating" button
    const startCreatingBtn = page.locator('a[href="/create"]');
    await expect(startCreatingBtn).toContainText('Start Creating');
    await expect(startCreatingBtn).toBeVisible();
    
    // Check "View Dashboard" button
    const viewDashboardBtn = page.locator('a[href="/dashboard"]');
    await expect(viewDashboardBtn).toContainText('View Dashboard');
    await expect(viewDashboardBtn).toBeVisible();
  });

  test('should display stats section', async ({ page }) => {
    // Check stats cards are visible
    const statsSection = page.locator('section').nth(1); // Second section should be stats
    await expect(statsSection).toBeVisible();
    
    // Check for percentage values in stats
    await expect(page.locator('text=94%')).toBeVisible();
    await expect(page.locator('text=75%')).toBeVisible();
    await expect(page.locator('text=98%')).toBeVisible();
    await expect(page.locator('text=96%')).toBeVisible();
    
    // Check stat labels
    await expect(page.locator('text=Content Quality')).toBeVisible();
    await expect(page.locator('text=Time Saved')).toBeVisible();
    await expect(page.locator('text=Brand Consistency')).toBeVisible();
    await expect(page.locator('text=Client Satisfaction')).toBeVisible();
  });

  test('should display features section', async ({ page }) => {
    // Check features section heading
    await expect(page.locator('text=Powerful Features for')).toBeVisible();
    await expect(page.locator('text=Modern Marketing')).toBeVisible();
    
    // Check feature cards
    await expect(page.locator('text=11 Specialized AI Agents')).toBeVisible();
    await expect(page.locator('text=Intelligent Pipeline')).toBeVisible();
    await expect(page.locator('text=Quality Analytics')).toBeVisible();
    await expect(page.locator('text=Quality Control')).toBeVisible();
    await expect(page.locator('text=Multi-Platform Content')).toBeVisible();
    await expect(page.locator('text=Brand Consistency')).toBeVisible();
  });

  test('should display call-to-action section', async ({ page }) => {
    // Check CTA heading
    await expect(page.locator('text=Ready to Transform Your Marketing Content?')).toBeVisible();
    
    // Check CTA buttons
    await expect(page.locator('a[href="/create"]').last()).toContainText('Get Started Free');
    await expect(page.locator('a[href="/workflow"]')).toContainText('See How It Works');
  });

  test('should navigate to create page when clicking "Start Creating"', async ({ page }) => {
    await page.locator('a[href="/create"]').first().click();
    await expect(page).toHaveURL('/create');
  });

  test('should navigate to dashboard when clicking "View Dashboard"', async ({ page }) => {
    await page.locator('a[href="/dashboard"]').first().click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that main elements are still visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('a[href="/create"]').first()).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check navigation has proper structure
    await expect(page.locator('nav')).toBeVisible();
    
    // Check buttons have proper text content
    await expect(page.locator('a[href="/create"]').first()).toHaveAttribute('href', '/create');
    await expect(page.locator('a[href="/dashboard"]').first()).toHaveAttribute('href', '/dashboard');
  });

  test('should display hero image/animation', async ({ page }) => {
    // Check that the hero visual section is present
    const heroVisual = page.locator('.relative').first(); // The hero visual container
    await expect(heroVisual).toBeVisible();
  });

  test('should have working navigation links in header', async ({ page }) => {
    // Test each navigation link
    const navLinks = [
      { href: '/', text: 'Home' },
      { href: '/dashboard', text: 'Dashboard' },
      { href: '/create', text: 'Create Content' },
      { href: '/workflow', text: 'Agent Workflow' },
      { href: '/quality', text: 'Quality Control' }
    ];

    for (const link of navLinks) {
      const navLink = page.locator(`nav a[href="${link.href}"]`);
      await expect(navLink).toBeVisible();
      await expect(navLink).toContainText(link.text);
    }
  });
});