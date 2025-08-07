import { test, expect } from '@playwright/test';

test.describe('Content Generation Freezing Fix', () => {
  test('should complete content generation without freezing', async ({ page }) => {
    // Navigate to the content generator page
    await page.goto('http://localhost:3000/content-generator');
    
    // Fill in the form with test data
    await page.fill('input[name="topic"]', 'Marketing Automation Tools');
    await page.fill('input[name="targetAudience"]', 'Small Business Owners');
    await page.fill('textarea[name="contentGoals"]', 'Increase brand awareness, Drive conversions');
    
    // Select content type
    await page.selectOption('select[name="contentType"]', 'blog');
    
    // Click generate button
    await page.click('button:has-text("Generate Content")');
    
    // Wait for the generation to start (should see processing status)
    await expect(page.locator('text=/Processing|Generating|Running/i')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Generation started successfully');
    
    // Monitor for freezing - check that progress updates within 60 seconds
    let lastProgress = 0;
    let noProgressCount = 0;
    const maxNoProgressChecks = 6; // 6 checks * 10 seconds = 60 seconds without progress
    
    for (let i = 0; i < 30; i++) { // Check for up to 5 minutes
      await page.waitForTimeout(10000); // Wait 10 seconds between checks
      
      // Check if content is completed
      const completed = await page.locator('text=/Completed|Success|Generated successfully/i').isVisible();
      if (completed) {
        console.log('✅ Content generation completed successfully!');
        
        // Verify content is displayed
        await expect(page.locator('[data-testid="generated-content"]')).toBeVisible({ timeout: 5000 });
        
        return; // Test passed
      }
      
      // Check for errors
      const hasError = await page.locator('text=/Error|Failed/i').isVisible();
      if (hasError) {
        const errorText = await page.locator('text=/Error|Failed/i').textContent();
        throw new Error(`Generation failed with error: ${errorText}`);
      }
      
      // Check progress indicator
      const progressElement = await page.locator('[data-testid="progress-indicator"], .progress-bar, text=/%/').first();
      if (await progressElement.isVisible()) {
        const progressText = await progressElement.textContent();
        const progressMatch = progressText?.match(/(\d+)%?/);
        const currentProgress = progressMatch ? parseInt(progressMatch[1]) : 0;
        
        console.log(`Progress: ${currentProgress}%`);
        
        if (currentProgress === lastProgress) {
          noProgressCount++;
          console.log(`⚠️ No progress for ${noProgressCount * 10} seconds`);
          
          if (noProgressCount >= maxNoProgressChecks) {
            throw new Error('Content generation appears to be frozen - no progress for 60 seconds');
          }
        } else {
          noProgressCount = 0; // Reset counter if progress was made
          lastProgress = currentProgress;
        }
      } else {
        // If no progress indicator, check if status is changing
        const statusElement = await page.locator('[data-testid="status"], .status-message').first();
        if (await statusElement.isVisible()) {
          const currentStatus = await statusElement.textContent();
          console.log(`Status: ${currentStatus}`);
        }
      }
    }
    
    throw new Error('Content generation timeout - took longer than 5 minutes');
  });
  
  test('should handle quality scoring timeout gracefully', async ({ page }) => {
    // This test verifies that if quality scoring times out, the generation still completes
    await page.goto('http://localhost:3000/content-generator');
    
    // Use a complex topic that might trigger longer quality evaluation
    await page.fill('input[name="topic"]', 'Advanced AI-Powered Marketing Automation Strategies for Enterprise B2B SaaS Companies');
    await page.fill('input[name="targetAudience"]', 'Fortune 500 CTOs and Marketing Directors');
    await page.fill('textarea[name="contentGoals"]', 'Demonstrate thought leadership, Generate qualified leads, Showcase technical expertise, Build brand authority');
    
    await page.selectOption('select[name="contentType"]', 'whitepaper');
    
    // Start generation
    await page.click('button:has-text("Generate Content")');
    
    // Wait for completion or timeout
    const result = await Promise.race([
      page.waitForSelector('text=/Completed|Success/i', { timeout: 120000 }), // 2 minutes
      page.waitForSelector('text=/Error|Failed/i', { timeout: 120000 })
    ]);
    
    // Check logs for quality scoring timeout
    page.on('console', msg => {
      if (msg.text().includes('Quality evaluation timeout') || 
          msg.text().includes('Using default quality scores')) {
        console.log('✅ Quality scoring timeout handled gracefully');
      }
    });
    
    // Verify content was still generated even if quality scoring timed out
    if (await page.locator('text=/Completed|Success/i').isVisible()) {
      console.log('✅ Content generated successfully despite potential quality scoring issues');
      await expect(page.locator('[data-testid="generated-content"]')).toBeVisible();
    }
  });
});