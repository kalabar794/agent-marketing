import { test, expect } from '@playwright/test';

test.describe('Reproduce Content Generation Error', () => {
  test('should reproduce "Failed to start content generation" error', async ({ page }) => {
    // Navigate to the create page
    await page.goto('/create');
    
    // Wait for the page to load and take initial screenshot
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'error-reproduction-initial.png', fullPage: true });
    
    // Fill out the form with test data
    await expect(page.locator('form')).toBeVisible();
    
    // Fill in the topic field
    const topicField = page.locator('input[name="topic"]');
    await expect(topicField).toBeVisible();
    await topicField.fill('Test Blog Post About AI Marketing');
    
    // Fill in the audience field (could be textarea or input)
    const audienceField = page.locator('textarea[name="audience"], input[name="audience"]').first();
    await expect(audienceField).toBeVisible();
    await audienceField.fill('Digital marketers and business owners interested in AI automation');
    
    // Fill in the goals field (could be textarea or input)
    const goalsField = page.locator('textarea[name="goals"], input[name="goals"]').first();
    await expect(goalsField).toBeVisible();
    await goalsField.fill('Create engaging content that drives traffic and conversions');
    
    // Select content type if available
    const contentTypeSelect = page.locator('select[name="contentType"]');
    if (await contentTypeSelect.count() > 0) {
      await contentTypeSelect.selectOption('blog');
    }
    
    // Take screenshot before submission
    await page.screenshot({ path: 'error-reproduction-filled-form.png', fullPage: true });
    
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Listen for network requests and responses
    const networkRequests: any[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/content/generate')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData(),
        });
      }
    });
    
    const networkResponses: any[] = [];
    page.on('response', async (response) => {
      if (response.url().includes('/api/content/generate')) {
        try {
          const responseText = await response.text();
          networkResponses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            body: responseText
          });
        } catch (e) {
          networkResponses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            error: 'Failed to read response body'
          });
        }
      }
    });
    
    // Submit the form
    const submitButton = page.locator('button[type="submit"], input[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    // Wait a moment for the error to occur
    await page.waitForTimeout(3000);
    
    // Take screenshot after submission
    await page.screenshot({ path: 'error-reproduction-after-submit.png', fullPage: true });
    
    // Look for error messages on the page
    const errorMessage = page.locator('text="Failed to start content generation"');
    if (await errorMessage.count() > 0) {
      console.log('✅ Successfully reproduced the error message!');
      await page.screenshot({ path: 'error-reproduction-error-visible.png', fullPage: true });
    }
    
    // Check for any error indicators
    const errorIndicators = [
      'text="Failed to start content generation"',
      'text="Error"',
      'text="Something went wrong"',
      '[data-testid="error"]',
      '.error',
      '.alert-error'
    ];
    
    for (const selector of errorIndicators) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`Found error indicator: ${selector}`);
        console.log(`Text: ${await element.textContent()}`);
      }
    }
    
    // Log console errors
    if (consoleErrors.length > 0) {
      console.log('\n📋 Console Errors:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // Log network requests
    if (networkRequests.length > 0) {
      console.log('\n🌐 Network Requests to /api/content/generate:');
      networkRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.method} ${req.url}`);
        if (req.postData) {
          console.log(`   Data: ${req.postData}`);
        }
      });
    }
    
    // Log network responses
    if (networkResponses.length > 0) {
      console.log('\n📥 Network Responses from /api/content/generate:');
      networkResponses.forEach((res, index) => {
        console.log(`${index + 1}. Status: ${res.status} ${res.statusText}`);
        console.log(`   URL: ${res.url}`);
        if (res.body) {
          console.log(`   Body: ${res.body.substring(0, 500)}...`);
        }
        if (res.error) {
          console.log(`   Error: ${res.error}`);
        }
      });
    }
    
    // Wait a bit longer to see if any delayed error messages appear
    await page.waitForTimeout(2000);
    
    // Take final screenshot
    await page.screenshot({ path: 'error-reproduction-final.png', fullPage: true });
  });
});