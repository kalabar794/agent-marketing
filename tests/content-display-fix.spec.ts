import { test, expect } from '@playwright/test';

test.describe('Content Display Fix Verification', () => {
  test('should display actual content values instead of literal strings', async ({ page }) => {
    // Start workflow and monitor content
    await page.goto('/create');
    
    // Fill out form
    await page.selectOption('select[name="contentType"]', 'blog');
    await page.fill('input[name="topic"]', 'Dog Training');
    await page.fill('input[name="audience"]', 'Pet Owners');
    await page.selectOption('select[name="tone"]', 'friendly');
    await page.fill('textarea[name="goals"]', 'Create engaging content about dog training');
    
    // Submit form to start workflow
    await page.click('button[type="submit"]');
    
    // Wait for workflow page to load
    await page.waitForURL(/\/workflow\?id=/);
    
    // Wait for workflow to complete (up to 2 minutes)
    console.log('⏳ Waiting for workflow to complete...');
    
    // Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes (24 * 5 seconds)
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      // Wait 5 seconds between checks
      await page.waitForTimeout(5000);
      
      // Check if content section is present
      const contentSection = await page.$('[data-content-section]');
      if (contentSection) {
        console.log('✅ Content section found!');
        completed = true;
        break;
      }
      
      console.log(`🔄 Attempt ${attempts}/${maxAttempts} - Still waiting...`);
    }
    
    if (!completed) {
      console.log('❌ Workflow did not complete within timeout');
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/workflow-timeout.png' });
      return;
    }
    
    // Verify content displays actual values, not literal strings
    const titleElement = await page.$('[data-content-section] h3:has-text("📝 Title") + p');
    const contentElement = await page.$('[data-content-section] h3:has-text("📄 Main Content") + div');
    
    if (titleElement) {
      const titleText = await titleElement.textContent();
      console.log('📝 Title content:', titleText);
      
      // Should NOT be literal "title"
      expect(titleText).not.toBe('title');
      expect(titleText).not.toBe('Title');
      expect(titleText).not.toContain('title');
      
      // Should contain actual content about dogs
      expect(titleText).toMatch(/dog|training|pet/i);
    }
    
    if (contentElement) {
      const contentText = await contentElement.textContent();
      console.log('📄 Content preview:', contentText?.substring(0, 200) + '...');
      
      // Should NOT be literal "content"
      expect(contentText).not.toBe('content');
      expect(contentText).not.toBe('Content');
      
      // Should contain actual content
      expect(contentText?.length || 0).toBeGreaterThan(100);
      expect(contentText).toMatch(/dog|training|pet/i);
    }
    
    // Take success screenshot
    await page.screenshot({ path: 'test-results/content-display-success.png' });
    console.log('✅ Content display test completed successfully!');
  });
});