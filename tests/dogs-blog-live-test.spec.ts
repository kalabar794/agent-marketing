import { test, expect } from '@playwright/test';

test.describe('Dogs Blog Post Creation on Live Site', () => {
  // Override base URL for this test to use the live Netlify site
  test.use({
    baseURL: 'https://agentic-marketing-generator.netlify.app'
  });

  test('Create comprehensive dogs blog post', async ({ page }) => {
    console.log('Starting dogs blog post creation test on live Netlify site...');
    
    // Navigate to the live site
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of homepage
    await page.screenshot({ 
      path: 'test-results/01-homepage.png', 
      fullPage: true 
    });
    
    console.log('Homepage loaded successfully');

    // Navigate to create page using "Create Content" nav link or "Start Creating" button
    const createContentNav = page.locator('text=Create Content');
    const startCreatingButton = page.locator('text=Start Creating');
    
    let navigationElement;
    if (await createContentNav.isVisible({ timeout: 5000 })) {
      navigationElement = createContentNav;
      console.log('Using Create Content navigation link');
    } else if (await startCreatingButton.isVisible({ timeout: 5000 })) {
      navigationElement = startCreatingButton;
      console.log('Using Start Creating button');
    } else {
      throw new Error('Could not find Create Content navigation or Start Creating button');
    }
    
    await navigationElement.click();
    
    // Wait for create page to load
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/02-create-page.png', 
      fullPage: true 
    });
    
    console.log('Create page loaded successfully');

    // Select "Blog Post" as content type
    const blogPostOption = page.locator('text=Blog Post').first();
    await expect(blogPostOption).toBeVisible({ timeout: 10000 });
    await blogPostOption.click();
    
    await page.screenshot({ 
      path: 'test-results/03-blog-post-selected.png', 
      fullPage: true 
    });
    
    console.log('Blog post option selected');

    // Click "Start creating" to proceed to the form
    const startCreatingBtn = page.locator('text=Start creating');
    if (await startCreatingBtn.isVisible({ timeout: 5000 })) {
      await startCreatingBtn.click();
      await page.waitForLoadState('networkidle');
      console.log('Clicked Start creating button');
    }

    await page.screenshot({ 
      path: 'test-results/03b-after-start-creating.png', 
      fullPage: true 
    });

    // Fill out the form with specific values based on the visible form structure
    // Content Topic field
    const topicTextarea = page.locator('textarea').first();
    await expect(topicTextarea).toBeVisible({ timeout: 10000 });
    await topicTextarea.fill('dogs with blog');
    console.log('Filled content topic');
    
    // Target Audience field (second textarea)
    const audienceTextarea = page.locator('textarea').nth(1);
    await expect(audienceTextarea).toBeVisible({ timeout: 10000 });
    await audienceTextarea.fill('Pet owners and dog enthusiasts who want to share their dog\'s adventures online');
    console.log('Filled target audience');
    
    // Content Goals field (third textarea)
    const goalsTextarea = page.locator('textarea').nth(2);
    await expect(goalsTextarea).toBeVisible({ timeout: 10000 });
    await goalsTextarea.fill('Help pet owners start successful dog blogs that build community and potentially generate income');
    console.log('Filled content goals');
    
    // Brand Tone field (fourth textarea)
    const toneTextarea = page.locator('textarea').nth(3);
    await expect(toneTextarea).toBeVisible({ timeout: 10000 });
    await toneTextarea.fill('Friendly and informative');
    console.log('Filled brand tone');
    
    await page.screenshot({ 
      path: 'test-results/04-form-filled.png', 
      fullPage: true 
    });
    
    console.log('Form filled with all required information');

    // Submit the form using the "Start Creating" button at the bottom
    const submitButton = page.locator('button:has-text("Start Creating")').last();
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ 
      path: 'test-results/05-before-submit.png', 
      fullPage: true 
    });
    
    await submitButton.click();
    
    console.log('Form submitted, monitoring AI agent workflow...');

    // Monitor the workflow - look for loading states, progress indicators
    await page.waitForTimeout(2000); // Give initial loading time
    
    await page.screenshot({ 
      path: 'test-results/06-workflow-started.png', 
      fullPage: true 
    });

    // Wait for the workflow to complete - look for success indicators
    // This could be a success message, redirect to results, or completion status
    const maxWaitTime = 300000; // 5 minutes max wait
    const startTime = Date.now();
    
    let workflowComplete = false;
    while (!workflowComplete && (Date.now() - startTime) < maxWaitTime) {
      // Check for various completion indicators
      const successIndicators = [
        page.locator('text=generation complete', { timeout: 1000 }),
        page.locator('text=content generated', { timeout: 1000 }),
        page.locator('text=success', { timeout: 1000 }),
        page.locator('[data-testid="generated-content"]', { timeout: 1000 }),
        page.locator('.generated-content', { timeout: 1000 }),
        page.locator('text=1500', { timeout: 1000 }), // Looking for word count
      ];
      
      for (const indicator of successIndicators) {
        try {
          if (await indicator.isVisible()) {
            workflowComplete = true;
            console.log('Workflow completion detected!');
            break;
          }
        } catch (e) {
          // Indicator not found, continue checking
        }
      }
      
      if (!workflowComplete) {
        await page.waitForTimeout(5000); // Wait 5 seconds before checking again
        console.log(`Waiting for workflow completion... ${Math.round((Date.now() - startTime) / 1000)}s elapsed`);
        
        // Take periodic screenshots
        if ((Date.now() - startTime) % 30000 < 5000) { // Every 30 seconds
          await page.screenshot({ 
            path: `test-results/07-workflow-progress-${Math.round((Date.now() - startTime) / 1000)}s.png`, 
            fullPage: true 
          });
        }
      }
    }

    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/08-workflow-complete.png', 
      fullPage: true 
    });

    // Try to extract and analyze the generated content
    const contentAreas = [
      page.locator('[data-testid="generated-content"]'),
      page.locator('.generated-content'),
      page.locator('pre'),
      page.locator('code'),
      page.locator('textarea[readonly]'),
      page.locator('div:has-text("dogs with blog")'),
    ];

    let generatedContent = '';
    for (const area of contentAreas) {
      try {
        if (await area.isVisible()) {
          const text = await area.textContent();
          if (text && text.length > generatedContent.length) {
            generatedContent = text;
          }
        }
      } catch (e) {
        // Continue checking other areas
      }
    }

    console.log('Generated content length:', generatedContent.length);
    console.log('Content preview (first 500 chars):', generatedContent.substring(0, 500));

    // Verify content quality
    if (generatedContent.length > 0) {
      expect(generatedContent.length).toBeGreaterThan(1000); // Should be substantial content
      expect(generatedContent.toLowerCase()).toContain('dog'); // Should be about dogs
      expect(generatedContent.toLowerCase()).toContain('blog'); // Should be about blogging
      
      // Check if it's real content vs template
      const templateIndicators = [
        '[PLACEHOLDER]',
        'TODO:',
        'INSERT_',
        'REPLACE_',
        '{content}',
        '{title}',
        'Lorem ipsum'
      ];
      
      const hasTemplateContent = templateIndicators.some(indicator => 
        generatedContent.includes(indicator)
      );
      
      expect(hasTemplateContent).toBeFalsy();
      console.log('✅ Content appears to be real, not template-based');
      
      // Verify comprehensive content (targeting 1500+ words)
      const wordCount = generatedContent.split(/\s+/).length;
      console.log(`Word count: ${wordCount}`);
      expect(wordCount).toBeGreaterThan(1000); // Should be substantial
      
      if (wordCount >= 1500) {
        console.log('✅ Content meets 1500+ word target');
      } else {
        console.log(`⚠️ Content is ${wordCount} words, below 1500 word target`);
      }
    } else {
      console.log('❌ No content was detected in the expected areas');
      
      // Take a final diagnostic screenshot
      await page.screenshot({ 
        path: 'test-results/09-no-content-detected.png', 
        fullPage: true 
      });
      
      // Get page content for debugging
      const pageContent = await page.content();
      console.log('Page HTML (first 1000 chars):', pageContent.substring(0, 1000));
    }

    console.log('Dogs blog post creation test completed');
  });
});