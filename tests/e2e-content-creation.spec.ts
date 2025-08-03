import { test, expect } from '@playwright/test'

test.describe('End-to-End Content Creation', () => {
  test.setTimeout(300000); // 5 minutes for the entire test

  test('should create a blog post about AI in marketing', async ({ page }) => {
    console.log('Starting blog post creation test...');
    
    // 1. Go to the main page
    await page.goto('https://agentic-marketing-generator.netlify.app');
    await expect(page).toHaveTitle(/AI Marketing/);
    
    // 2. Click Create Content
    await page.click('text=Create Content');
    await page.waitForURL('**/create');
    
    // 3. Select Blog Post
    await page.click('text=Blog Post');
    await expect(page.locator('.ring-2.ring-yellow-400')).toBeVisible();
    
    // 4. Fill in the form
    await page.fill('textarea[placeholder*="AI in marketing"]', 'AI in Marketing: How Artificial Intelligence is Transforming Digital Strategies');
    await page.fill('textarea[placeholder*="Marketing professionals"]', 'Marketing professionals and business owners');
    await page.fill('textarea[placeholder*="Generate leads"]', 'Educate about AI benefits, generate leads, establish thought leadership');
    await page.fill('textarea[placeholder*="Professional and authoritative"]', 'Professional yet approachable, data-driven');
    
    // 5. Click Start Creating
    await page.click('text=Start Creating');
    
    // 6. Wait for workflow page
    await page.waitForURL('**/workflow?id=*', { timeout: 10000 });
    console.log('Workflow started:', page.url());
    
    // 7. Monitor the workflow progress
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5 second intervals
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      // Check for error state
      const errorElement = await page.locator('text=Failed to fetch workflow status').count();
      if (errorElement > 0) {
        throw new Error('Workflow failed with "Failed to fetch workflow status" error');
      }
      
      // Check progress
      const progressText = await page.locator('text=/\\d+%/').first().textContent() || '0%';
      const progress = parseInt(progressText);
      console.log(`Progress: ${progressText} (attempt ${attempts}/${maxAttempts})`);
      
      // Check if completed
      if (progress === 100) {
        completed = true;
        console.log('Workflow completed!');
        break;
      }
      
      // Check individual agent statuses
      const runningAgents = await page.locator('text=running').count();
      const completedAgents = await page.locator('text=completed').count();
      const failedAgents = await page.locator('text=failed').count();
      
      console.log(`Agents - Running: ${runningAgents}, Completed: ${completedAgents}, Failed: ${failedAgents}`);
      
      // Wait 5 seconds before next check
      await page.waitForTimeout(5000);
    }
    
    if (!completed) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'workflow-timeout.png', fullPage: true });
      throw new Error('Workflow did not complete within 5 minutes');
    }
    
    // 8. Check for View Final Content button
    const viewContentButton = page.locator('text=View Final Content');
    await expect(viewContentButton).toBeVisible({ timeout: 10000 });
    
    // 9. Click to view content
    await viewContentButton.click();
    
    // 10. Verify we have actual content
    await expect(page.locator('h1')).toContainText(/AI/);
    await expect(page.locator('text=/\\d+ words/')).toBeVisible();
    
    console.log('Blog post creation completed successfully!');
  });

  test('should create social media posts about dogs', async ({ page }) => {
    console.log('Starting social media post creation test...');
    
    // 1. Go to the main page
    await page.goto('https://agentic-marketing-generator.netlify.app');
    
    // 2. Click Create Content
    await page.click('text=Create Content');
    await page.waitForURL('**/create');
    
    // 3. Select Social Media Campaign
    await page.click('text=Social Media Campaign');
    await expect(page.locator('.ring-2.ring-yellow-400')).toBeVisible();
    
    // 4. Fill in the form
    await page.fill('textarea[placeholder*="AI in marketing"]', 'Dogs and Pet Care: Building a Community of Dog Lovers');
    await page.fill('textarea[placeholder*="Marketing professionals"]', 'Dog owners and pet enthusiasts');
    await page.fill('textarea[placeholder*="Generate leads"]', 'Build community engagement, increase brand awareness, drive traffic to pet products');
    await page.fill('textarea[placeholder*="Professional and authoritative"]', 'Friendly, warm, and engaging with a touch of humor');
    
    // 5. Click Start Creating
    await page.click('text=Start Creating');
    
    // 6. Wait for workflow page
    await page.waitForURL('**/workflow?id=*', { timeout: 10000 });
    console.log('Social media workflow started:', page.url());
    
    // 7. Monitor the workflow progress
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5 second intervals
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      // Check for error state
      const errorElement = await page.locator('text=Failed to fetch workflow status').count();
      if (errorElement > 0) {
        throw new Error('Social media workflow failed with "Failed to fetch workflow status" error');
      }
      
      // Check progress
      const progressText = await page.locator('text=/\\d+%/').first().textContent() || '0%';
      const progress = parseInt(progressText);
      console.log(`Social Media Progress: ${progressText} (attempt ${attempts}/${maxAttempts})`);
      
      // Check if completed
      if (progress === 100) {
        completed = true;
        console.log('Social media workflow completed!');
        break;
      }
      
      // Wait 5 seconds before next check
      await page.waitForTimeout(5000);
    }
    
    if (!completed) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'social-workflow-timeout.png', fullPage: true });
      throw new Error('Social media workflow did not complete within 5 minutes');
    }
    
    // 8. Check for View Final Content button
    const viewContentButton = page.locator('text=View Final Content');
    await expect(viewContentButton).toBeVisible({ timeout: 10000 });
    
    // 9. Verify we have platform-specific content
    await expect(page.locator('text=/LinkedIn|Twitter|Facebook/')).toBeVisible();
    
    console.log('Social media post creation completed successfully!');
  });

  test('should handle demo mode gracefully', async ({ page }) => {
    console.log('Testing demo mode behavior...');
    
    // 1. Start a workflow
    await page.goto('https://agentic-marketing-generator.netlify.app/create');
    await page.click('text=Blog Post');
    await page.fill('textarea[placeholder*="AI in marketing"]', 'Test Demo Mode');
    await page.fill('textarea[placeholder*="Marketing professionals"]', 'Test Audience');
    await page.fill('textarea[placeholder*="Generate leads"]', 'Test Goals');
    await page.click('text=Start Creating');
    
    // 2. Check if demo mode indicator appears
    await page.waitForURL('**/workflow?id=*', { timeout: 10000 });
    
    // 3. Look for demo mode indicators
    const demoIndicator = await page.locator('text=/Demo Mode|demo-workflow/').count();
    if (demoIndicator > 0) {
      console.log('Demo mode detected');
      await expect(page.locator('text=Demo Mode')).toBeVisible();
      
      // Demo mode should complete quickly
      await page.waitForTimeout(5000);
      const progress = await page.locator('text=100%').count();
      expect(progress).toBeGreaterThan(0);
    } else {
      console.log('Real mode detected - monitoring progress');
      // Real mode monitoring (same as above tests)
    }
  });
});