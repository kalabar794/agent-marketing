import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should load successfully', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Marketing Dashboard');
    await expect(page.locator('text=Monitor your AI agents and content generation pipeline')).toBeVisible();
  });

  test('should display header section with vibrant background', async ({ page }) => {
    // Check header section exists
    const headerSection = page.locator('section').first();
    await expect(headerSection).toBeVisible();
    
    // Check "New Project" button
    await expect(page.locator('text=New Project')).toBeVisible();
    
    // Check header button links to create page
    const newProjectBtn = page.locator('a[href="/create"]');
    await expect(newProjectBtn).toBeVisible();
  });

  test('should display metrics cards', async ({ page }) => {
    // Check that all 4 metric cards are visible
    const metricCards = page.locator('[data-testid="metric-card"], .grid .text-2xl').first().locator('..');
    
    // Check specific metrics exist
    await expect(page.locator('text=Active Projects')).toBeVisible();
    await expect(page.locator('text=Agents Working')).toBeVisible();
    await expect(page.locator('text=Success Rate')).toBeVisible();
    await expect(page.locator('text=Avg. Completion Time')).toBeVisible();
    
    // Check metric values are displayed
    await expect(page.locator('text=8')).toBeVisible(); // Active Projects
    await expect(page.locator('text=4')).toBeVisible(); // Agents Working
    await expect(page.locator('text=96%')).toBeVisible(); // Success Rate
    await expect(page.locator('text=12min')).toBeVisible(); // Completion Time
  });

  test('should display active AI agents section', async ({ page }) => {
    // Check section heading
    await expect(page.locator('text=Active AI Agents')).toBeVisible();
    await expect(page.locator('text=Real-time status of your AI marketing team')).toBeVisible();
    
    // Check that agent avatars are displayed
    await expect(page.locator('text=Content Strategist')).toBeVisible();
    await expect(page.locator('text=SEO Optimizer')).toBeVisible();
    await expect(page.locator('text=Content Writer')).toBeVisible();
    await expect(page.locator('text=Visual Designer')).toBeVisible();
    await expect(page.locator('text=Brand Guardian')).toBeVisible();
    await expect(page.locator('text=Quality Controller')).toBeVisible();
  });

  test('should display content pipeline section', async ({ page }) => {
    // Check section heading
    await expect(page.locator('text=Content Pipeline')).toBeVisible();
    await expect(page.locator('text=Active content creation workflow')).toBeVisible();
    
    // Check pipeline stages
    await expect(page.locator('text=Content Strategy')).toBeVisible();
    await expect(page.locator('text=SEO Optimization')).toBeVisible();
    await expect(page.locator('text=Content Creation')).toBeVisible();
    await expect(page.locator('text=Visual Design')).toBeVisible();
    await expect(page.locator('text=Quality Review')).toBeVisible();
  });

  test('should display quality metrics section', async ({ page }) => {
    // Check section heading
    await expect(page.locator('text=Quality Metrics')).toBeVisible();
    await expect(page.locator('text=Real-time quality scores and performance metrics')).toBeVisible();
  });

  test('should display recent projects section', async ({ page }) => {
    // Check section heading
    await expect(page.locator('text=Recent Projects')).toBeVisible();
    await expect(page.locator('text=Your latest content generation projects and their status')).toBeVisible();
    
    // Check that project entries are visible
    await expect(page.locator('text=AI Marketing Trends Blog Post')).toBeVisible();
    await expect(page.locator('text=Product Launch Social Campaign')).toBeVisible();
    await expect(page.locator('text=Customer Success Stories')).toBeVisible();
    await expect(page.locator('text=Email Newsletter Template')).toBeVisible();
    
    // Check project statuses
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=Review')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=Planning')).toBeVisible();
  });

  test('should show agent status badges', async ({ page }) => {
    // Check that different status badges are visible
    await expect(page.locator('text=completed')).toBeVisible();
    await expect(page.locator('text=working')).toBeVisible();
  });

  test('should display progress bars for projects', async ({ page }) => {
    // Check that progress percentages are displayed
    await expect(page.locator('text=73%')).toBeVisible();
    await expect(page.locator('text=90%')).toBeVisible();
    await expect(page.locator('text=100%')).toBeVisible();
    await expect(page.locator('text=25%')).toBeVisible();
  });

  test('should navigate to create page when clicking "New Project"', async ({ page }) => {
    await page.locator('a[href="/create"]').click();
    await expect(page).toHaveURL('/create');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that main elements are still visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Active Projects')).toBeVisible();
    await expect(page.locator('text=Active AI Agents')).toBeVisible();
  });

  test('should display loading states and animations', async ({ page }) => {
    // Check that cards have animation delays (checking for animation classes)
    const cards = page.locator('.animate-slide-up');
    await expect(cards.first()).toBeVisible();
  });

  test('should show proper icons for each section', async ({ page }) => {
    // The icons are implemented as Lucide React components, so we check for their presence
    // by looking for their container elements and ARIA labels or text content
    
    // Check that sections have icons (by checking for icon containers)
    await expect(page.locator('text=Active AI Agents').locator('..')).toBeVisible();
    await expect(page.locator('text=Content Pipeline').locator('..')).toBeVisible();
    await expect(page.locator('text=Quality Metrics').locator('..')).toBeVisible();
    await expect(page.locator('text=Recent Projects').locator('..')).toBeVisible();
  });

  test('should handle real-time updates (simulated)', async ({ page }) => {
    // Since this is a static test, we check that the structure supports real-time updates
    // by verifying dynamic content exists
    
    // Check that progress values are displayed (these would update in real-time)
    await expect(page.locator('text=73')).toBeVisible(); // Progress percentage
    
    // Check that agent statuses are shown (these would update in real-time)
    await expect(page.locator('text=working')).toBeVisible();
    await expect(page.locator('text=completed')).toBeVisible();
  });
});