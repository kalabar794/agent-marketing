import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should handle workflow page without ID parameter', async ({ page }) => {
    await page.goto('/workflow');
    
    // Should show appropriate error message
    await expect(page.locator('text=Workflow Error')).toBeVisible();
    await expect(page.locator('text=No workflow ID provided')).toBeVisible();
    
    // Should provide way to start new workflow
    const startButton = page.locator('a[href="/create"]');
    await expect(startButton).toBeVisible();
    await expect(startButton).toContainText('Start New Content Generation');
  });

  test('should handle quality page without ID parameter', async ({ page }) => {
    await page.goto('/quality');
    
    // Should show appropriate error message
    await expect(page.locator('text=Quality Analysis Error')).toBeVisible();
    await expect(page.locator('text=No workflow ID provided')).toBeVisible();
    
    // Should provide way to go back
    await expect(page.locator('text=Go Back')).toBeVisible();
  });

  test('should handle API failures gracefully on workflow page', async ({ page }) => {
    // Mock API failure
    await page.route('/api/content/generate*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.goto('/workflow?id=test-123');
    
    // Should show error state
    await expect(page.locator('text=Workflow Error')).toBeVisible();
    await expect(page.locator('text=Failed to fetch workflow status')).toBeVisible();
  });

  test('should handle API failures gracefully on quality page', async ({ page }) => {
    // Mock API failure
    await page.route('/api/content/generate*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.goto('/quality?id=test-123');
    
    // Should show error state
    await expect(page.locator('text=Quality Analysis Error')).toBeVisible();
    await expect(page.locator('text=Failed to fetch workflow status')).toBeVisible();
  });

  test('should handle network errors on create page', async ({ page }) => {
    await page.goto('/create');
    
    // Select content type and fill form
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    await page.fill('textarea[placeholder*="AI in marketing"]', 'Test Topic');
    await page.fill('textarea[placeholder*="Marketing professionals"]', 'Test Audience');
    await page.fill('textarea[placeholder*="Generate leads"]', 'Test Goals');
    
    // Mock network failure
    await page.route('/api/content/generate', async route => {
      await route.abort('failed');
    });
    
    // Try to submit
    await page.locator('text=Start Creating').click();
    
    // Should handle error with dialog
    await page.waitForEvent('dialog', dialog => {
      expect(dialog.message()).toContain('Failed to start content generation');
      dialog.accept();
      return true;
    });
  });

  test('should handle malformed API responses', async ({ page }) => {
    // Mock malformed response
    await page.route('/api/content/generate*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json'
      });
    });
    
    await page.goto('/workflow?id=test-123');
    
    // Should handle malformed response gracefully
    await expect(page.locator('text=Workflow Error')).toBeVisible();
  });

  test('should handle empty API responses', async ({ page }) => {
    // Mock empty response
    await page.route('/api/content/generate*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    });
    
    await page.goto('/workflow?id=test-123');
    
    // Should handle empty response gracefully
    await expect(page.locator('text=Workflow Error')).toBeVisible();
  });

  test('should handle slow API responses with timeout', async ({ page }) => {
    // Mock very slow response
    await page.route('/api/content/generate*', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'running', agents: [] })
      });
    });
    
    await page.goto('/workflow?id=test-123');
    
    // Should show loading state for extended period
    await expect(page.locator('text=Loading Workflow...')).toBeVisible();
    
    // Wait for reasonable time and check if error handling kicks in
    await page.waitForTimeout(3000);
    
    // Should still be loading or have error state
    const isLoading = await page.locator('text=Loading Workflow...').isVisible();
    const hasError = await page.locator('text=Workflow Error').isVisible();
    expect(isLoading || hasError).toBe(true);
  });

  test('should handle form validation errors on create page', async ({ page }) => {
    await page.goto('/create');
    
    // Select content type but don't fill required fields
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    
    // Try to submit without required fields
    await page.locator('text=Start Creating').click();
    
    // Should show validation error
    await page.waitForEvent('dialog', dialog => {
      expect(dialog.message()).toContain('Please fill in all required fields');
      dialog.accept();
      return true;
    });
  });

  test('should handle partial form completion', async ({ page }) => {
    await page.goto('/create');
    
    // Select content type and fill only some fields
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    await page.fill('textarea[placeholder*="AI in marketing"]', 'Test Topic');
    // Don't fill other required fields
    
    // Try to submit
    await page.locator('text=Start Creating').click();
    
    // Should show validation error for missing fields
    await page.waitForEvent('dialog', dialog => {
      expect(dialog.message()).toContain('Please fill in all required fields');
      dialog.accept();
      return true;
    });
  });

  test('should handle browser back button on error pages', async ({ page }) => {
    // Go to error page
    await page.goto('/workflow');
    await expect(page.locator('text=Workflow Error')).toBeVisible();
    
    // Use browser back (simulate going from another page)
    await page.goto('/dashboard');
    await page.goto('/workflow');
    await page.goBack();
    
    // Should return to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle quality approval errors', async ({ page }) => {
    // Mock successful workflow fetch but failed approval
    await page.route('/api/content/generate*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'completed',
          content: { title: 'Test Content' },
          qualityScores: { overall: 90, readability: 85, seo: 88, brandAlignment: 92, originality: 95 },
          agents: []
        })
      });
    });
    
    // Mock failed approval API
    await page.route('/api/quality', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Approval failed' })
      });
    });
    
    await page.goto('/quality?id=test-123');
    
    // Try to approve
    await page.locator('text=Approve & Publish').click();
    
    // Should handle approval error gracefully
    // The exact error handling depends on implementation
    // but it should not crash the page
    await expect(page.locator('text=Quality Control Center')).toBeVisible();
  });

  test('should handle missing workflow data', async ({ page }) => {
    // Mock response with minimal data
    await page.route('/api/content/generate*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'running',
          agents: []
        })
      });
    });
    
    await page.goto('/workflow?id=test-123');
    
    // Should handle missing data gracefully
    await expect(page.locator('text=Workflow in Progress')).toBeVisible();
    
    // Should show 0% completion when no agents
    await expect(page.locator('text=0%')).toBeVisible();
    await expect(page.locator('text=0 of 0 agents complete')).toBeVisible();
  });

  test('should handle invalid workflow IDs with special characters', async ({ page }) => {
    // Mock API error for invalid ID format
    await page.route('/api/content/generate*', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid workflow ID format' })
      });
    });
    
    await page.goto('/workflow?id=invalid%20id%20with%20spaces');
    
    // Should handle invalid ID format
    await expect(page.locator('text=Workflow Error')).toBeVisible();
  });
});