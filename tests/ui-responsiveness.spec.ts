import { test, expect } from '@playwright/test';

test.describe('UI Responsiveness', () => {
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Mobile Landscape', width: 667, height: 375 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop Small', width: 1280, height: 720 },
    { name: 'Desktop Large', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      test('home page should be responsive', async ({ page }) => {
        await page.goto('/');
        
        // Main elements should be visible
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('nav')).toBeVisible();
        await expect(page.locator('text=Start Creating')).toBeVisible();
        
        // Check navigation is functional
        await expect(page.locator('nav a[href="/dashboard"]')).toBeVisible();
        
        // Stats section should adapt
        await expect(page.locator('text=94%')).toBeVisible();
        await expect(page.locator('text=Content Quality')).toBeVisible();
      });

      test('dashboard should be responsive', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Main elements should be visible
        await expect(page.locator('h1')).toContainText('Marketing Dashboard');
        await expect(page.locator('text=New Project')).toBeVisible();
        
        // Metrics cards should be visible
        await expect(page.locator('text=Active Projects')).toBeVisible();
        await expect(page.locator('text=Agents Working')).toBeVisible();
        
        // Agent section should be visible
        await expect(page.locator('text=Active AI Agents')).toBeVisible();
      });

      test('create page should be responsive', async ({ page }) => {
        await page.goto('/create');
        
        // Main elements should be visible
        await expect(page.locator('h1')).toContainText('Create Professional Marketing Content');
        
        // Content type cards should be visible
        await expect(page.locator('text=Blog Post')).toBeVisible();
        await expect(page.locator('text=Social Media Campaign')).toBeVisible();
        
        // Cards should be clickable
        await page.locator('text=Blog Post').locator('..').locator('..').click();
        await expect(page.locator('text=Project Details')).toBeVisible();
      });

      test('workflow page error state should be responsive', async ({ page }) => {
        await page.goto('/workflow');
        
        // Error message should be visible
        await expect(page.locator('text=Workflow Error')).toBeVisible();
        await expect(page.locator('text=No workflow ID provided')).toBeVisible();
        
        // Action button should be visible
        await expect(page.locator('text=Start New Content Generation')).toBeVisible();
      });

      test('quality page error state should be responsive', async ({ page }) => {
        await page.goto('/quality');
        
        // Error message should be visible
        await expect(page.locator('text=Quality Analysis Error')).toBeVisible();
        await expect(page.locator('text=No workflow ID provided')).toBeVisible();
        
        // Action button should be visible
        await expect(page.locator('text=Go Back')).toBeVisible();
      });
    });
  }

  test('navigation should work on all screen sizes', async ({ page }) => {
    const testNavigation = async (width: number, height: number) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      
      // Brand should be visible
      await expect(page.locator('text=AgenticMarketing')).toBeVisible();
      
      // Navigation links should work
      await page.locator('nav a[href="/dashboard"]').click();
      await expect(page).toHaveURL('/dashboard');
      
      await page.locator('nav a[href="/create"]').click();
      await expect(page).toHaveURL('/create');
      
      await page.locator('nav a[href="/"]').click();
      await expect(page).toHaveURL('/');
    };
    
    // Test key breakpoints
    await testNavigation(375, 667); // Mobile
    await testNavigation(768, 1024); // Tablet
    await testNavigation(1280, 720); // Desktop
  });

  test('forms should be usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/create');
    
    // Select content type
    await page.locator('text=Blog Post').locator('..').locator('..').click();
    
    // Form should be visible and usable
    await expect(page.locator('text=Project Details')).toBeVisible();
    
    // Form fields should be accessible
    const topicField = page.locator('textarea[placeholder*="AI in marketing"]');
    await expect(topicField).toBeVisible();
    await topicField.fill('Mobile test topic');
    
    const audienceField = page.locator('textarea[placeholder*="Marketing professionals"]');
    await expect(audienceField).toBeVisible();
    await audienceField.fill('Mobile test audience');
    
    // Form should show validation
    await page.locator('text=Start Creating').click();
    
    await page.waitForEvent('dialog', dialog => {
      expect(dialog.message()).toContain('Please fill in all required fields');
      dialog.accept();
      return true;
    });
  });

  test('cards and layouts should stack properly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test home page layout
    await page.goto('/');
    
    // Hero section should stack vertically
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a[href="/create"]').first()).toBeVisible();
    
    // Stats should be in mobile grid
    await expect(page.locator('text=94%')).toBeVisible();
    await expect(page.locator('text=75%')).toBeVisible();
    
    // Test dashboard layout
    await page.goto('/dashboard');
    
    // Metrics should stack on mobile
    await expect(page.locator('text=Active Projects')).toBeVisible();
    await expect(page.locator('text=Agents Working')).toBeVisible();
  });

  test('touch interactions should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/create');
    
    // Test tap interactions
    await page.tap('text=Blog Post');
    
    // Should show selection
    const selectedCard = page.locator('text=Blog Post').locator('..').locator('..');
    await expect(selectedCard).toHaveClass(/ring-2/);
    
    // Test scrolling and interaction
    await page.locator('textarea[placeholder*="AI in marketing"]').tap();
    await page.locator('textarea[placeholder*="AI in marketing"]').fill('Touch test');
    
    // Should show content
    await expect(page.locator('text=Ready to create your Blog Post')).toBeVisible();
  });

  test('text should be readable at all sizes', async ({ page }) => {
    const checkTextReadability = async (width: number, height: number) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      
      // Main heading should be visible and appropriately sized
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
      
      // Check computed font size is reasonable for viewport
      const fontSize = await heading.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      
      // Font size should be appropriate for screen size
      const fontSizeNum = parseInt(fontSize);
      if (width < 768) {
        // Mobile should have smaller but readable text
        expect(fontSizeNum).toBeGreaterThan(24);
      } else {
        // Desktop can have larger text
        expect(fontSizeNum).toBeGreaterThan(32);
      }
    };
    
    await checkTextReadability(375, 667); // Mobile
    await checkTextReadability(1280, 720); // Desktop
  });

  test('images and visuals should scale properly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Hero visual section should be present and scaled
    const heroVisual = page.locator('.relative').first();
    await expect(heroVisual).toBeVisible();
    
    // Check that visual elements don't overflow
    const boundingBox = await heroVisual.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });

  test('loading states should be visible on all screen sizes', async ({ page }) => {
    // Mock delayed response
    await page.route('/api/content/generate*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'running', agents: [] })
      });
    });
    
    const testLoadingState = async (width: number, height: number) => {
      await page.setViewportSize({ width, height });
      await page.goto('/workflow?id=test-123');
      
      // Loading state should be visible
      await expect(page.locator('text=Loading Workflow...')).toBeVisible();
      await expect(page.locator('.animate-spin')).toBeVisible();
    };
    
    await testLoadingState(375, 667); // Mobile
    await testLoadingState(1280, 720); // Desktop
  });

  test('error states should be accessible on all devices', async ({ page }) => {
    const testErrorState = async (width: number, height: number) => {
      await page.setViewportSize({ width, height });
      await page.goto('/workflow');
      
      // Error message should be visible
      await expect(page.locator('text=Workflow Error')).toBeVisible();
      await expect(page.locator('text=No workflow ID provided')).toBeVisible();
      
      // Action button should be tappable/clickable
      const actionButton = page.locator('a[href="/create"]');
      await expect(actionButton).toBeVisible();
      
      // Button should have adequate touch target size on mobile
      if (width < 768) {
        const buttonBox = await actionButton.boundingBox();
        expect(buttonBox?.height).toBeGreaterThan(44); // iOS recommended minimum
      }
    };
    
    await testErrorState(375, 667); // Mobile
    await testErrorState(1280, 720); // Desktop
  });

  test('horizontal scrolling should not occur', async ({ page }) => {
    const checkNoHorizontalScroll = async (width: number, height: number) => {
      await page.setViewportSize({ width, height });
      
      const pages = ['/', '/dashboard', '/create'];
      
      for (const url of pages) {
        await page.goto(url);
        
        // Check that body width doesn't exceed viewport
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(width + 1); // Allow 1px tolerance
      }
    };
    
    await checkNoHorizontalScroll(375, 667); // Mobile
    await checkNoHorizontalScroll(768, 1024); // Tablet
  });
});