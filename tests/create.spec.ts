import { test, expect } from '@playwright/test';

test.describe('Create Content Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
  });

  test('should load successfully', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Create Professional Marketing Content');
    await expect(page.locator('text=Choose your content type and let our specialized AI agents')).toBeVisible();
  });

  test('should display header section with badge', async ({ page }) => {
    // Check AI-Powered Content Creation badge
    await expect(page.locator('text=AI-Powered Content Creation')).toBeVisible();
    
    // Check subtitle
    await expect(page.locator('text=Choose your content type and let our specialized AI agents collaborate')).toBeVisible();
  });

  test('should display content type selection section', async ({ page }) => {
    // Check section heading
    await expect(page.locator('text=What type of content do you want to create?')).toBeVisible();
    
    // Check all content type cards are present
    await expect(page.locator('text=Blog Post')).toBeVisible();
    await expect(page.locator('text=Social Media Campaign')).toBeVisible();
    await expect(page.locator('text=Email Campaign')).toBeVisible();
    await expect(page.locator('text=Landing Page')).toBeVisible();
  });

  test('should display content type details', async ({ page }) => {
    // Check Blog Post details
    await expect(page.locator('text=Long-form content for thought leadership and SEO')).toBeVisible();
    await expect(page.locator('text=15-20 minutes')).toBeVisible();
    
    // Check Social Media Campaign details
    await expect(page.locator('text=Multi-platform social content with engagement focus')).toBeVisible();
    await expect(page.locator('text=8-12 minutes')).toBeVisible();
    
    // Check Email Campaign details
    await expect(page.locator('text=Conversion-focused email sequences and newsletters')).toBeVisible();
    await expect(page.locator('text=10-15 minutes')).toBeVisible();
    
    // Check Landing Page details
    await expect(page.locator('text=High-converting pages for campaigns and products')).toBeVisible();
    await expect(page.locator('text=20-25 minutes')).toBeVisible();
  });

  test('should display features for each content type', async ({ page }) => {
    // Check Blog Post features
    await expect(page.locator('text=SEO Optimized')).toBeVisible();
    await expect(page.locator('text=2000+ words')).toBeVisible();
    await expect(page.locator('text=Research backed')).toBeVisible();
    await expect(page.locator('text=Brand aligned')).toBeVisible();
    
    // Check Social Media features
    await expect(page.locator('text=Multi-platform')).toBeVisible();
    await expect(page.locator('text=Visual content')).toBeVisible();
    await expect(page.locator('text=Hashtag research')).toBeVisible();
    await expect(page.locator('text=Engagement optimized')).toBeVisible();
  });

  test('should allow content type selection', async ({ page }) => {
    // Click on Blog Post
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    
    // Check that selection styling is applied (ring border)
    const selectedCard = page.locator('text=Blog Post').locator('..').locator('..');
    await expect(selectedCard).toHaveClass(/ring-2/);
    
    // Check that project details form appears
    await expect(page.locator('text=Project Details')).toBeVisible();
  });

  test('should show project details form after selection', async ({ page }) => {
    // Select Blog Post
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    
    // Check form appears
    await expect(page.locator('text=Project Details')).toBeVisible();
    await expect(page.locator('text=Provide details to help our AI agents create the perfect blog post for you')).toBeVisible();
    
    // Check form fields
    await expect(page.locator('text=Content Topic')).toBeVisible();
    await expect(page.locator('text=Target Audience')).toBeVisible();
    await expect(page.locator('text=Content Goals')).toBeVisible();
    await expect(page.locator('text=Brand Tone')).toBeVisible();
  });

  test('should validate form fields', async ({ page }) => {
    // Select a content type
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    
    // Try to submit without filling required fields
    await page.locator('text=Start Creating').click();
    
    // Should show validation alert
    await page.waitForEvent('dialog', dialog => {
      expect(dialog.message()).toContain('Please fill in all required fields');
      dialog.accept();
      return true;
    });
  });

  test('should fill out form and show summary', async ({ page }) => {
    // Select Blog Post
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    
    // Fill out form fields
    await page.fill('textarea[placeholder*="AI in marketing"]', 'The Future of AI in Digital Marketing');
    await page.fill('textarea[placeholder*="Marketing professionals"]', 'Digital marketing managers and CMOs');
    await page.fill('textarea[placeholder*="Generate leads"]', 'Generate leads and establish thought leadership');
    await page.fill('textarea[placeholder*="Professional and authoritative"]', 'Professional yet approachable');
    
    // Check that summary section appears
    await expect(page.locator('text=Ready to create your Blog Post')).toBeVisible();
    await expect(page.locator('text=6 AI agents will collaborate on this project')).toBeVisible();
  });

  test('should display AI agents in summary', async ({ page }) => {
    // Select Blog Post
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    
    // Check that agent badges are shown
    await expect(page.locator('text=Content Strategist')).toBeVisible();
    await expect(page.locator('text=SEO Optimizer')).toBeVisible();
    await expect(page.locator('text=Content Writer')).toBeVisible();
    await expect(page.locator('text=Brand Guardian')).toBeVisible();
    await expect(page.locator('text=Quality Controller')).toBeVisible();
  });

  test('should handle form submission (mock)', async ({ page }) => {
    // Mock the API response
    await page.route('/api/content/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ workflowId: 'test-workflow-123' })
      });
    });
    
    // Select Blog Post and fill form
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    await page.fill('textarea[placeholder*="AI in marketing"]', 'Test Topic');
    await page.fill('textarea[placeholder*="Marketing professionals"]', 'Test Audience');
    await page.fill('textarea[placeholder*="Generate leads"]', 'Test Goals');
    
    // Submit form
    await page.locator('text=Start Creating').click();
    
    // Should redirect to workflow page with ID
    await expect(page).toHaveURL('/workflow?id=test-workflow-123');
  });

  test('should show loading state during submission', async ({ page }) => {
    // Mock a delayed API response
    await page.route('/api/content/generate', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ workflowId: 'test-workflow-123' })
      });
    });
    
    // Select and fill form
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    await page.fill('textarea[placeholder*="AI in marketing"]', 'Test Topic');
    await page.fill('textarea[placeholder*="Marketing professionals"]', 'Test Audience');
    await page.fill('textarea[placeholder*="Generate leads"]', 'Test Goals');
    
    // Click submit
    await page.locator('text=Start Creating').click();
    
    // Check loading state
    await expect(page.locator('text=Initializing AI Agents...')).toBeVisible();
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/content/generate', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    // Select and fill form
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    await page.fill('textarea[placeholder*="AI in marketing"]', 'Test Topic');
    await page.fill('textarea[placeholder*="Marketing professionals"]', 'Test Audience');
    await page.fill('textarea[placeholder*="Generate leads"]', 'Test Goals');
    
    // Submit and expect error dialog
    await page.locator('text=Start Creating').click();
    
    await page.waitForEvent('dialog', dialog => {
      expect(dialog.message()).toContain('Failed to start content generation');
      dialog.accept();
      return true;
    });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check main elements are visible on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Blog Post')).toBeVisible();
    await expect(page.locator('text=Social Media Campaign')).toBeVisible();
  });

  test('should show different content for different selections', async ({ page }) => {
    // Test Social Media Campaign selection
    await page.locator('text=Social Media Campaign').locator('..').locator('..').click();
    await expect(page.locator('text=Ready to create your Social Media Campaign')).toBeVisible();
    await expect(page.locator('text=4 AI agents will collaborate on this project')).toBeVisible();
    
    // Test Email Campaign selection
    await page.locator('text=Email Campaign').locator('..').locator('..').click();
    await expect(page.locator('text=Ready to create your Email Campaign')).toBeVisible();
    
    // Test Landing Page selection
    await page.locator('text=Landing Page').locator('..').locator('..').click();
    await expect(page.locator('text=Ready to create your Landing Page')).toBeVisible();
  });

  test('should show estimated completion time', async ({ page }) => {
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    
    // Check estimated time is shown
    await expect(page.locator('text=Estimated completion time: 15-20 minutes')).toBeVisible();
  });
});