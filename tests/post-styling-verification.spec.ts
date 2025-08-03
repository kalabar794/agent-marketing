import { test, expect } from '@playwright/test';

test.describe('Post-Styling Verification Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });
  });

  test.describe('Homepage Tests', () => {
    test('should load homepage without errors and display all key elements', async ({ page }) => {
      await page.goto('/');
      
      // Check page loads successfully
      await expect(page).toHaveTitle(/AgenticFlow - AI Marketing Content Generator/);
      
      // Verify navigation is present and functional
      await expect(page.locator('nav')).toBeVisible();
      
      // Check main hero section
      await expect(page.locator('h1')).toContainText('Agentic Marketing');
      await expect(page.locator('h1')).toContainText('Content Generator');
      
      // Verify main CTA buttons are present and clickable (check for both with and without trailing slash)
      const startCreatingBtn = page.locator('a[href="/create"], a[href="/create/"]').first();
      await expect(startCreatingBtn).toBeVisible();
      await expect(startCreatingBtn).toContainText('Start Creating');
      
      const viewDashboardBtn = page.locator('a[href="/dashboard"], a[href="/dashboard/"]').first();
      await expect(viewDashboardBtn).toBeVisible();
      await expect(viewDashboardBtn).toContainText('View Dashboard');
      
      // Check feature badges
      await expect(page.locator('text=No setup required')).toBeVisible();
      await expect(page.locator('text=Professional results')).toBeVisible();
      await expect(page.locator('text=Brand consistency')).toBeVisible();
      
      // Verify stats section
      await expect(page.locator('text=94%')).toBeVisible();
      await expect(page.locator('text=75%')).toBeVisible();
      await expect(page.locator('text=98%')).toBeVisible();
      await expect(page.locator('text=96%')).toBeVisible();
      
      // Check features section
      await expect(page.locator('text=11 Specialized AI Agents')).toBeVisible();
      await expect(page.locator('text=Intelligent Pipeline')).toBeVisible();
      await expect(page.locator('text=Quality Analytics')).toBeVisible();
      
      // Verify final CTA
      await expect(page.locator('text=Ready to Transform Your Marketing Content?')).toBeVisible();
      await expect(page.locator('a[href="/create"], a[href="/create/"]').last()).toContainText('Get Started Free');
    });

    test('should have responsive design on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Main elements should still be visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('a[href="/create"], a[href="/create/"]').first()).toBeVisible();
    });
  });

  test.describe('Navigation Tests', () => {
    test('should navigate between all pages correctly', async ({ page }) => {
      await page.goto('/');
      
      // Test navigation to Dashboard
      await page.locator('nav a[href="/dashboard"]').click();
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('h1')).toContainText('Marketing Dashboard');
      
      // Test navigation to Create
      await page.locator('nav a[href="/create"]').click();
      await expect(page).toHaveURL('/create');
      await expect(page.locator('h1')).toContainText('Create Professional');
      await expect(page.locator('h1')).toContainText('Marketing Content');
      
      // Test navigation to Workflow (should handle missing ID gracefully)
      await page.locator('nav a[href="/workflow"]').click();
      await expect(page).toHaveURL('/workflow');
      await expect(page.locator('text=This page shows real-time progress of content generation workflows')).toBeVisible();
      
      // Test navigation to Quality (should handle missing ID gracefully)
      await page.locator('nav a[href="/quality"]').click();
      await expect(page).toHaveURL('/quality');
      await expect(page.locator('text=This page shows quality analysis for specific content workflows')).toBeVisible();
      
      // Return to Home
      await page.locator('nav a[href="/"]').click();
      await expect(page).toHaveURL('/');
      await expect(page.locator('h1')).toContainText('Agentic Marketing');
    });

    test('should show active navigation states correctly', async ({ page }) => {
      const pages = [
        { url: '/', selector: 'nav a[href="/"]' },
        { url: '/dashboard', selector: 'nav a[href="/dashboard"]' },
        { url: '/create', selector: 'nav a[href="/create"]' }
      ];

      for (const pageInfo of pages) {
        await page.goto(pageInfo.url);
        // Check if the active link has the orange color class
        await expect(page.locator(pageInfo.selector)).toHaveClass(/text-orange-400/);
      }
    });

    test('should display consistent navigation across all pages', async ({ page }) => {
      const pages = ['/', '/dashboard', '/create'];
      
      for (const url of pages) {
        await page.goto(url);
        
        // Check brand logo/text is present
        await expect(page.locator('text=AgenticMarketing')).toBeVisible();
        
        // Check all navigation links are present
        await expect(page.locator('nav a[href="/"]')).toContainText('Home');
        await expect(page.locator('nav a[href="/dashboard"]')).toContainText('Dashboard');
        await expect(page.locator('nav a[href="/create"]')).toContainText('Create Content');
        await expect(page.locator('nav a[href="/workflow"]')).toContainText('Agent Workflow');
        await expect(page.locator('nav a[href="/quality"]')).toContainText('Quality Control');
      }
    });
  });

  test.describe('Create Page Tests', () => {
    test('should load create page and display content type selection', async ({ page }) => {
      await page.goto('/create');
      
      // Check header section
      await expect(page.locator('h1')).toContainText('Create Professional');
      await expect(page.locator('h1')).toContainText('Marketing Content');
      await expect(page.locator('text=AI-Powered Content Creation')).toBeVisible();
      
      // Check content type selection section
      await expect(page.locator('text=What type of content do you want to create?')).toBeVisible();
      
      // Verify all content type cards are present
      await expect(page.locator('text=Blog Post')).toBeVisible();
      await expect(page.locator('text=Social Media Campaign')).toBeVisible();
      await expect(page.locator('text=Email Campaign')).toBeVisible();
      await expect(page.locator('text=Landing Page')).toBeVisible();
      
      // Check content type details
      await expect(page.locator('text=Long-form content for thought leadership and SEO')).toBeVisible();
      await expect(page.locator('text=15-20 minutes')).toBeVisible();
    });

    test('should allow content type selection and show project details form', async ({ page }) => {
      await page.goto('/create');
      
      // Select Blog Post content type
      await page.locator('text=Blog Post').click();
      
      // Verify the card is selected (should have ring styling)
      const selectedCard = page.locator('[data-testid="content-type-blog"], .ring-2, .ring-yellow-400').first();
      await expect(selectedCard).toBeVisible();
      
      // Check that project details form appears
      await expect(page.locator('text=Project Details')).toBeVisible();
      await expect(page.locator('text=Content Topic')).toBeVisible();
      await expect(page.locator('text=Target Audience')).toBeVisible();
      await expect(page.locator('text=Content Goals')).toBeVisible();
      await expect(page.locator('text=Brand Tone')).toBeVisible();
      
      // Check that summary section appears
      await expect(page.locator('text=Ready to create your Blog Post')).toBeVisible();
      await expect(page.locator('text=Start Creating')).toBeVisible();
    });

    test('should display form fields and allow input', async ({ page }) => {
      await page.goto('/create');
      
      // Select a content type
      await page.locator('text=Social Media Campaign').click();
      
      // Fill in form fields
      await page.fill('textarea[placeholder*="AI in marketing"]', 'Test content topic');
      await page.fill('textarea[placeholder*="Marketing professionals"]', 'Test audience');
      await page.fill('textarea[placeholder*="Generate leads"]', 'Test goals');
      await page.fill('textarea[placeholder*="Professional and authoritative"]', 'Test tone');
      
      // Verify inputs are filled
      await expect(page.locator('textarea[placeholder*="AI in marketing"]')).toHaveValue('Test content topic');
      await expect(page.locator('textarea[placeholder*="Marketing professionals"]')).toHaveValue('Test audience');
      await expect(page.locator('textarea[placeholder*="Generate leads"]')).toHaveValue('Test goals');
      await expect(page.locator('textarea[placeholder*="Professional and authoritative"]')).toHaveValue('Test tone');
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/create');
      
      // Main elements should be visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Blog Post')).toBeVisible();
      await expect(page.locator('text=Social Media Campaign')).toBeVisible();
    });
  });

  test.describe('Dashboard Page Tests', () => {
    test('should load dashboard and display key sections', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check main heading
      await expect(page.locator('h1')).toContainText('Marketing Dashboard');
      
      // Should display some content (metrics, agents, projects sections)
      // Note: We're checking for the absence of major errors rather than specific content
      // since the dashboard might be empty initially
      const content = page.locator('main, .container, [role="main"]');
      await expect(content).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
    });
  });

  test.describe('Workflow Page Tests', () => {
    test('should handle missing workflow ID gracefully', async ({ page }) => {
      await page.goto('/workflow');
      
      // Should display appropriate message for missing workflow ID
      await expect(page.locator('text=This page shows real-time progress of content generation workflows')).toBeVisible();
      await expect(page.locator('text=Agent Workflow')).toBeVisible();
      
      // Should show buttons to start new content or view dashboard
      await expect(page.locator('a[href="/create"]')).toContainText('Start New Content Generation');
      await expect(page.locator('a[href="/dashboard"]')).toContainText('View Dashboard');
      
      // Page should still load without crashing
      await expect(page.locator('nav')).toBeVisible();
    });

    test('should be accessible via navigation', async ({ page }) => {
      await page.goto('/');
      await page.locator('nav a[href="/workflow"]').click();
      await expect(page).toHaveURL('/workflow');
    });
  });

  test.describe('Quality Page Tests', () => {
    test('should handle missing workflow ID gracefully', async ({ page }) => {
      await page.goto('/quality');
      
      // Should display appropriate message for missing workflow ID
      await expect(page.locator('text=This page shows quality analysis for specific content workflows')).toBeVisible();
      await expect(page.locator('text=Quality Analysis')).toBeVisible();
      
      // Should show buttons to start new content or view dashboard
      await expect(page.locator('a[href="/create"]')).toContainText('Start New Content Generation');
      await expect(page.locator('a[href="/dashboard"]')).toContainText('View Dashboard');
      
      // Page should still load without crashing
      await expect(page.locator('nav')).toBeVisible();
    });

    test('should be accessible via navigation', async ({ page }) => {
      await page.goto('/');
      await page.locator('nav a[href="/quality"]').click();
      await expect(page).toHaveURL('/quality');
    });
  });

  test.describe('Console Error Check', () => {
    test('should not have console errors on any page', async ({ page }) => {
      const consoleErrors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      const pages = ['/', '/create', '/dashboard', '/workflow', '/quality'];
      
      for (const url of pages) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Wait a bit to catch any delayed errors
        await page.waitForTimeout(1000);
      }
      
      // Filter out known acceptable errors (like missing API endpoints in dev)
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('Failed to fetch') && 
        !error.includes('NetworkError') &&
        !error.includes('404') &&
        !error.includes('API endpoint')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Interactive Elements', () => {
    test('should have working button hover states and interactions', async ({ page }) => {
      await page.goto('/');
      
      // Test main CTA buttons
      const startBtn = page.locator('a[href="/create"]').first();
      
      // Button should be clickable
      await expect(startBtn).toBeEnabled();
      
      // Click should navigate correctly
      await startBtn.click();
      await expect(page).toHaveURL('/create');
    });

    test('should have working content type selection', async ({ page }) => {
      await page.goto('/create');
      
      // Click on different content types and verify selection works
      const blogPost = page.locator('text=Blog Post').first();
      const socialMedia = page.locator('text=Social Media Campaign').first();
      
      await blogPost.click();
      await expect(page.locator('text=Ready to create your Blog Post')).toBeVisible();
      
      await socialMedia.click();
      await expect(page.locator('text=Ready to create your Social Media Campaign')).toBeVisible();
    });
  });

  test.describe('Page Load Performance', () => {
    test('should load pages within reasonable time', async ({ page }) => {
      const pages = ['/', '/create', '/dashboard'];
      
      for (const url of pages) {
        const startTime = Date.now();
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        
        // Should load within 5 seconds
        expect(loadTime).toBeLessThan(5000);
      }
    });
  });
});