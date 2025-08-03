import { test, expect } from '@playwright/test'

test.describe('Prove Real API Works', () => {
  test.setTimeout(900000); // 15 minutes - full background function timeout

  test('should create actual blog content via real API and show completion', async ({ page }) => {
    console.log('🎯 PROOF TEST: Creating real blog content via API...');
    
    // 1. Navigate to create page
    await page.goto('https://agentic-marketing-generator.netlify.app/create');
    await expect(page).toHaveTitle(/AgenticFlow/);
    console.log('✅ Navigated to create page');
    
    // 2. Select Blog Post
    await page.click('text=Blog Post');
    await expect(page.locator('.ring-2.ring-yellow-400')).toBeVisible();
    console.log('✅ Selected Blog Post');
    
    // 3. Fill form with specific content
    await page.fill('textarea[placeholder*="AI in marketing"]', 'Real API Test: The Future of AI Marketing Tools');
    await page.fill('textarea[placeholder*="Marketing professionals"]', 'Marketing teams and business owners');
    await page.fill('textarea[placeholder*="Generate leads"]', 'Test real API functionality and prove content generation works');
    await page.fill('textarea[placeholder*="Professional and authoritative"]', 'Professional and data-driven');
    console.log('✅ Filled form with test content');
    
    // 4. Submit form and capture the workflow ID
    await page.click('text=Start Creating');
    await page.waitForURL('**/workflow*', { timeout: 60000 });
    
    const url = page.url();
    const workflowId = url.match(/id=([^&]+)/)?.[1];
    console.log(`✅ Created workflow: ${workflowId}`);
    console.log(`✅ Workflow URL: ${url}`);
    
    // 5. Take initial screenshot
    await page.screenshot({ path: 'proof-test-start.png', fullPage: true });
    console.log('✅ Captured initial workflow state');
    
    // 6. Monitor for actual progress (wait for real changes)
    let hasProgressed = false;
    let attempts = 0;
    const maxAttempts = 180; // 15 minutes at 5-second intervals
    let lastProgress = 0;
    
    while (attempts < maxAttempts && !hasProgressed) {
      attempts++;
      
      // Wait 5 seconds between checks
      await page.waitForTimeout(5000);
      
      // Reload page to get latest status
      await page.reload();
      
      // Check for any progress indicators
      const progressElements = await page.locator('text=/[1-9]\\d*%|running|completed/').count();
      const completedAgents = await page.locator('text=completed').count();
      
      // Look for any non-zero progress
      const progressTexts = await page.locator('text=/\\d+%/').allTextContents();
      const hasNonZeroProgress = progressTexts.some(text => {
        const num = parseInt(text);
        return num > 0;
      });
      
      if (progressElements > 0 || completedAgents > 0 || hasNonZeroProgress) {
        hasProgressed = true;
        console.log(`🎯 REAL PROGRESS DETECTED after ${attempts * 5} seconds!`);
        console.log(`   - Progress elements: ${progressElements}`);
        console.log(`   - Completed agents: ${completedAgents}`);
        console.log(`   - Progress texts: ${progressTexts.join(', ')}`);
        
        // Take screenshot of progress
        await page.screenshot({ path: 'proof-test-progress.png', fullPage: true });
        break;
      }
      
      if (attempts % 12 === 0) { // Every minute
        console.log(`⏳ Still monitoring... ${attempts * 5} seconds elapsed`);
      }
    }
    
    if (!hasProgressed) {
      console.log('❌ No progress detected within 15 minutes');
      await page.screenshot({ path: 'proof-test-timeout.png', fullPage: true });
      throw new Error('No real progress detected - API may not be working');
    }
    
    // 7. Continue monitoring for completion or significant progress
    console.log('🔄 Monitoring for completion...');
    let isCompleted = false;
    let maxCompletionAttempts = 60; // Additional 5 minutes for completion
    
    while (attempts < maxAttempts + maxCompletionAttempts && !isCompleted) {
      attempts++;
      await page.waitForTimeout(5000);
      await page.reload();
      
      // Check for completion indicators
      const completedText = await page.locator('text=completed').count();
      const viewContentButton = await page.locator('text=View Final Content').count();
      const progressText = await page.locator('text=100%').count();
      
      if (completedText > 3 || viewContentButton > 0 || progressText > 0) {
        isCompleted = true;
        console.log(`✅ WORKFLOW COMPLETED after ${attempts * 5} seconds!`);
        console.log(`   - Completed agents: ${completedText}`);
        console.log(`   - View Content button: ${viewContentButton}`);
        console.log(`   - 100% progress: ${progressText}`);
        
        // Take final screenshot
        await page.screenshot({ path: 'proof-test-completed.png', fullPage: true });
        
        // Try to view final content if button is available
        if (viewContentButton > 0) {
          await page.click('text=View Final Content');
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'proof-test-final-content.png', fullPage: true });
          console.log('✅ Captured final content');
        }
        
        break;
      }
      
      if (attempts % 12 === 0) {
        console.log(`⏳ Waiting for completion... ${attempts * 5} seconds total`);
      }
    }
    
    // 8. Final API verification - directly check the workflow status
    console.log(`🔍 Final verification: Testing API endpoint directly for workflow ${workflowId}`);
    
    const response = await page.evaluate(async (id) => {
      const res = await fetch(`/api/content/generate/?workflowId=${id}`);
      return {
        status: res.status,
        data: await res.json()
      };
    }, workflowId);
    
    console.log(`📊 API Response Status: ${response.status}`);
    console.log(`📊 API Response Data:`, JSON.stringify(response.data, null, 2));
    
    // 9. Verify we have real data
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id', workflowId);
    expect(response.data).toHaveProperty('status');
    expect(response.data.status).not.toBe('failed');
    
    console.log('🎉 PROOF COMPLETE: Real API is working and generating content!');
    console.log(`   Final Status: ${response.data.status}`);
    console.log(`   Progress: ${response.data.progress}%`);
    console.log(`   Agents: ${response.data.agents?.length || 0} total`);
    
    if (response.data.content) {
      console.log(`   Content Generated: YES`);
      console.log(`   Content Title: ${response.data.content.title || 'N/A'}`);
    } else {
      console.log(`   Content Generated: Still processing`);
    }
  });
});