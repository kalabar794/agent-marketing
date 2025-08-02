import { test, expect } from '@playwright/test';

test.describe('Full Integration Tests', () => {
  test('complete content creation flow', async ({ page }) => {
    // Mock API responses for the complete flow
    await page.route('/api/content/generate', async route => {
      if (route.request().method() === 'POST') {
        // Mock content generation start
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ workflowId: 'integration-test-123' })
        });
      } else {
        // Mock workflow status
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'completed',
            startTime: new Date().toISOString(),
            estimatedTimeRemaining: 0,
            content: {
              title: 'Integration Test Content',
              content: 'This is test content generated during integration testing.'
            },
            qualityScores: {
              overall: 95,
              readability: 88,
              seo: 92,
              brandAlignment: 97,
              originality: 99
            },
            agents: [
              {
                agentId: 'content-strategist',
                status: 'completed',
                progress: 100,
                startTime: new Date().toISOString(),
                duration: 120
              },
              {
                agentId: 'ai-seo-optimizer',
                status: 'completed',
                progress: 100,
                startTime: new Date().toISOString(),
                duration: 90
              },
              {
                agentId: 'content-writer',
                status: 'completed',
                progress: 100,
                startTime: new Date().toISOString(),
                duration: 180
              }
            ]
          })
        });
      }
    });

    // Mock quality API
    await page.route('/api/quality', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, status: 'approved' })
      });
    });

    // 1. Start at home page
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Agentic Marketing');

    // 2. Navigate to create content
    await page.locator('a[href="/create"]').first().click();
    await expect(page).toHaveURL('/create');
    await expect(page.locator('h1')).toContainText('Create Professional Marketing Content');

    // 3. Select content type
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    await expect(page.locator('text=Project Details')).toBeVisible();

    // 4. Fill out the form
    await page.fill('textarea[placeholder*="AI in marketing"]', 'The Future of AI-Powered Marketing Automation');
    await page.fill('textarea[placeholder*="Marketing professionals"]', 'Marketing directors and digital marketing managers');
    await page.fill('textarea[placeholder*="Generate leads"]', 'Generate qualified leads and establish thought leadership in AI marketing');
    await page.fill('textarea[placeholder*="Professional and authoritative"]', 'Professional yet accessible, with data-driven insights');

    // 5. Submit the form
    await page.locator('text=Start Creating').click();

    // 6. Should redirect to workflow page
    await expect(page).toHaveURL('/workflow?id=integration-test-123');
    await expect(page.locator('text=Workflow in Progress')).toBeVisible();

    // 7. Navigate to quality control
    await page.locator('a[href="/quality?id=integration-test-123"]').first().click();
    await expect(page).toHaveURL('/quality?id=integration-test-123');
    await expect(page.locator('text=Quality Control Center')).toBeVisible();

    // 8. Check quality metrics are displayed
    await expect(page.locator('text=Integration Test Content')).toBeVisible();
    await expect(page.locator('text=Overall Quality Score')).toBeVisible();
    await expect(page.locator('text=95')).toBeVisible();

    // 9. Approve the content
    await page.locator('text=Approve & Publish').click();
    await expect(page.locator('text=Content approved')).toBeVisible();

    // 10. Navigate back to dashboard to see completed project
    await page.locator('nav a[href="/dashboard"]').click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Marketing Dashboard')).toBeVisible();
  });

  test('navigation flow through all pages', async ({ page }) => {
    // Mock APIs for pages that need them
    await setupMockAPIs(page);

    // Test complete navigation flow
    const navigationFlow = [
      { url: '/', expectedHeading: 'Agentic Marketing' },
      { url: '/dashboard', expectedHeading: 'Marketing Dashboard' },
      { url: '/create', expectedHeading: 'Create Professional Marketing Content' },
      { url: '/workflow?id=test-123', expectedHeading: 'Workflow in Progress' },
      { url: '/quality?id=test-123', expectedHeading: 'Quality Control Center' }
    ];

    for (const step of navigationFlow) {
      await page.goto(step.url);
      await expect(page.locator('h1')).toContainText(step.expectedHeading);
      
      // Check navigation is consistent
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('text=AgenticMarketing')).toBeVisible();
    }
  });

  test('form validation and error handling flow', async ({ page }) => {
    // Test form validation flow
    await page.goto('/create');

    // 1. Try to submit without selecting content type
    // (no selection made, button should not appear)
    await expect(page.locator('text=Start Creating')).not.toBeVisible();

    // 2. Select content type but don't fill form
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    await expect(page.locator('text=Start Creating')).toBeVisible();

    // 3. Try to submit empty form
    await page.locator('text=Start Creating').click();
    
    await page.waitForEvent('dialog', dialog => {
      expect(dialog.message()).toContain('Please fill in all required fields');
      dialog.accept();
      return true;
    });

    // 4. Fill partial form
    await page.fill('textarea[placeholder*="AI in marketing"]', 'Test Topic');
    await page.locator('text=Start Creating').click();
    
    await page.waitForEvent('dialog', dialog => {
      expect(dialog.message()).toContain('Please fill in all required fields');
      dialog.accept();
      return true;
    });

    // 5. Fill complete form with API error
    await page.route('/api/content/generate', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.fill('textarea[placeholder*="Marketing professionals"]', 'Test Audience');
    await page.fill('textarea[placeholder*="Generate leads"]', 'Test Goals');
    
    await page.locator('text=Start Creating').click();
    
    await page.waitForEvent('dialog', dialog => {
      expect(dialog.message()).toContain('Failed to start content generation');
      dialog.accept();
      return true;
    });
  });

  test('error state recovery flow', async ({ page }) => {
    // 1. Start with error state
    await page.goto('/workflow');
    await expect(page.locator('text=Workflow Error')).toBeVisible();

    // 2. Navigate to create new content
    await page.locator('a[href="/create"]').click();
    await expect(page).toHaveURL('/create');

    // 3. Successfully create content (mock success)
    await page.route('/api/content/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ workflowId: 'recovery-test-123' })
      });
    });

    await page.locator('text=Blog Post').locator('..').locator('..').click();
    await page.fill('textarea[placeholder*="AI in marketing"]', 'Recovery Test');
    await page.fill('textarea[placeholder*="Marketing professionals"]', 'Test Audience');
    await page.fill('textarea[placeholder*="Generate leads"]', 'Test Goals');
    
    await page.locator('text=Start Creating').click();

    // 4. Should successfully navigate to workflow
    await expect(page).toHaveURL('/workflow?id=recovery-test-123');
  });

  test('responsive design across all pages', async ({ page }) => {
    const pages = ['/', '/dashboard', '/create'];
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1280, height: 720 }  // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      for (const url of pages) {
        await page.goto(url);
        
        // Check basic elements are visible
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('nav')).toBeVisible();
        
        // Check no horizontal scrolling
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 1);
      }
    }
  });

  test('accessibility and keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Check that focus is visible on interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test navigation with keyboard
    await page.goto('/create');
    
    // Tab through form elements
    await page.keyboard.press('Tab'); // Should focus first element
    await page.keyboard.press('Tab'); // Should focus next element
    
    // Check that form is keyboard accessible
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    
    // Form fields should be focusable
    await page.keyboard.press('Tab');
    const formField = page.locator(':focus');
    await expect(formField).toBeVisible();
  });

  test('performance and loading states', async ({ page }) => {
    // Test loading states with delayed responses
    await page.route('/api/content/generate*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'running',
          agents: [],
          startTime: new Date().toISOString()
        })
      });
    });

    await page.goto('/workflow?id=test-123');
    
    // Should show loading state
    await expect(page.locator('text=Loading Workflow...')).toBeVisible();
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Should eventually load content
    await expect(page.locator('text=Workflow in Progress')).toBeVisible({ timeout: 5000 });
  });

  test('data persistence across navigation', async ({ page }) => {
    await page.goto('/create');
    
    // Fill form data
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    await page.fill('textarea[placeholder*="AI in marketing"]', 'Persistent Test Topic');
    await page.fill('textarea[placeholder*="Marketing professionals"]', 'Persistent Test Audience');
    
    // Navigate away and back
    await page.locator('nav a[href="/dashboard"]').click();
    await page.locator('nav a[href="/create"]').click();
    
    // Note: In a real app, you might want to test form persistence
    // For now, we just verify the page loads correctly
    await expect(page.locator('text=Create Professional Marketing Content')).toBeVisible();
  });
});

async function setupMockAPIs(page: any) {
  // Mock workflow API
  await page.route('/api/content/generate*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'completed',
        startTime: new Date().toISOString(),
        content: { title: 'Mock Content' },
        qualityScores: {
          overall: 90,
          readability: 85,
          seo: 88,
          brandAlignment: 92,
          originality: 95
        },
        agents: [
          {
            agentId: 'content-strategist',
            status: 'completed',
            progress: 100
          }
        ]
      })
    });
  });

  // Mock quality API
  await page.route('/api/quality', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });
}