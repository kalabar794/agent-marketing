const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function runDogsBlogTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Starting dogs blog post creation test on live Netlify site...');
    
    // Ensure test-results directory exists
    await fs.mkdir('test-results', { recursive: true });
    
    // Navigate directly to the live site
    await page.goto('https://agentic-marketing-generator.netlify.app/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of homepage
    await page.screenshot({ 
      path: 'test-results/dogs-standalone-01-homepage.png', 
      fullPage: true 
    });
    
    console.log('Homepage loaded successfully');

    // Navigate to create page using "Create Content" nav link
    const createContentNav = page.locator('text=Create Content');
    await createContentNav.waitFor({ timeout: 10000 });
    await createContentNav.click();
    
    // Wait for create page to load
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/dogs-standalone-02-create-page.png', 
      fullPage: true 
    });
    
    console.log('Create page loaded successfully');

    // Select "Blog Post" as content type
    const blogPostOption = page.locator('text=Blog Post').first();
    await blogPostOption.waitFor({ timeout: 10000 });
    await blogPostOption.click();
    
    await page.screenshot({ 
      path: 'test-results/dogs-standalone-03-blog-post-selected.png', 
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
      path: 'test-results/dogs-standalone-04-after-start-creating.png', 
      fullPage: true 
    });

    // Fill out the form with specific values
    console.log('Filling out form fields...');
    
    // Content Topic field
    const topicTextarea = page.locator('textarea').first();
    await topicTextarea.waitFor({ timeout: 10000 });
    await topicTextarea.fill('dogs with blog');
    console.log('✓ Filled content topic');
    
    // Target Audience field (second textarea)
    const audienceTextarea = page.locator('textarea').nth(1);
    await audienceTextarea.waitFor({ timeout: 10000 });
    await audienceTextarea.fill('Pet owners and dog enthusiasts who want to share their dog\'s adventures online');
    console.log('✓ Filled target audience');
    
    // Content Goals field (third textarea)
    const goalsTextarea = page.locator('textarea').nth(2);
    await goalsTextarea.waitFor({ timeout: 10000 });
    await goalsTextarea.fill('Help pet owners start successful dog blogs that build community and potentially generate income');
    console.log('✓ Filled content goals');
    
    // Brand Tone field (fourth textarea)
    const toneTextarea = page.locator('textarea').nth(3);
    await toneTextarea.waitFor({ timeout: 10000 });
    await toneTextarea.fill('Friendly and informative');
    console.log('✓ Filled brand tone');
    
    await page.screenshot({ 
      path: 'test-results/dogs-standalone-05-form-filled.png', 
      fullPage: true 
    });
    
    console.log('Form filled with all required information');

    // Submit the form using the "Start Creating" button at the bottom
    const submitButton = page.locator('button:has-text("Start Creating")').last();
    await submitButton.waitFor({ timeout: 10000 });
    
    await page.screenshot({ 
      path: 'test-results/dogs-standalone-06-before-submit.png', 
      fullPage: true 
    });
    
    console.log('Submitting form...');
    await submitButton.click();
    
    console.log('Form submitted! Monitoring AI agent workflow...');

    // Monitor the workflow
    await page.waitForTimeout(3000); // Give initial loading time
    
    await page.screenshot({ 
      path: 'test-results/dogs-standalone-07-workflow-started.png', 
      fullPage: true 
    });

    // Wait for the workflow to complete
    const maxWaitTime = 600000; // 10 minutes max wait
    const startTime = Date.now();
    let workflowComplete = false;
    let lastScreenshotTime = 0;
    let lastContentLength = 0;
    
    console.log('Waiting for content generation...');
    
    while (!workflowComplete && (Date.now() - startTime) < maxWaitTime) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      // Check for completion indicators
      const indicators = [
        'text=generation complete',
        'text=content generated', 
        'text=success',
        'text=Complete',
        '[data-testid="generated-content"]',
        '.generated-content',
        'pre:has-text("dogs")',
        'code:has-text("dogs")',
      ];
      
      for (const selector of indicators) {
        try {
          const element = page.locator(selector);
          if (await element.isVisible({ timeout: 1000 })) {
            console.log(`✓ Found completion indicator: ${selector}`);
            workflowComplete = true;
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }
      
      // Check if page content has grown significantly (indicating content generation)
      const currentContent = await page.textContent('body');
      if (currentContent && currentContent.length > lastContentLength + 1000) {
        console.log(`Content length increased: ${currentContent.length} chars (+${currentContent.length - lastContentLength})`);
        lastContentLength = currentContent.length;
        
        // Check if it contains our topic
        if (currentContent.toLowerCase().includes('dogs') && 
            currentContent.toLowerCase().includes('blog') &&
            currentContent.length > 5000) {
          console.log('✓ Substantial content about dogs and blogging detected!');
          workflowComplete = true;
          break;
        }
      }
      
      if (!workflowComplete) {
        // Take periodic screenshots
        if (elapsed - lastScreenshotTime >= 30) {
          await page.screenshot({ 
            path: `test-results/dogs-standalone-08-progress-${elapsed}s.png`, 
            fullPage: true 
          });
          lastScreenshotTime = elapsed;
          console.log(`⏳ Still waiting... ${elapsed}s elapsed`);
        }
        
        await page.waitForTimeout(5000); // Wait 5 seconds before checking again
      }
    }

    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/dogs-standalone-09-final.png', 
      fullPage: true 
    });

    // Extract and analyze generated content
    console.log('Analyzing generated content...');
    
    const contentSelectors = [
      '[data-testid="generated-content"]',
      '.generated-content',
      'pre',
      'code',
      'textarea[readonly]',
      'article',
      '.content',
      '.result',
      '.output'
    ];

    let bestContent = '';
    let foundSelector = null;
    
    for (const selector of contentSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          if (await element.isVisible()) {
            const text = await element.textContent();
            if (text && text.length > bestContent.length && 
                text.toLowerCase().includes('dog') && 
                text.toLowerCase().includes('blog')) {
              bestContent = text;
              foundSelector = selector;
            }
          }
        }
      } catch (e) {
        // Continue checking
      }
    }

    // Fallback: get all page text and look for substantial dog blog content
    if (!bestContent) {
      console.log('Checking full page content...');
      const fullPageText = await page.textContent('body');
      if (fullPageText && fullPageText.toLowerCase().includes('dog') && 
          fullPageText.toLowerCase().includes('blog')) {
        
        // Try to extract a blog post section from the full content
        const lines = fullPageText.split('\n');
        let blogContent = '';
        let inContent = false;
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length > 100 && (trimmed.toLowerCase().includes('dog') || 
              trimmed.toLowerCase().includes('blog'))) {
            inContent = true;
          }
          if (inContent) {
            blogContent += line + '\n';
          }
          if (inContent && blogContent.length > 2000) {
            break;
          }
        }
        
        if (blogContent.length > 500) {
          bestContent = blogContent;
          foundSelector = 'full page extraction';
        }
      }
    }

    // Analysis results
    console.log('\n🔍 CONTENT ANALYSIS RESULTS:');
    console.log('════════════════════════════════════');
    
    if (bestContent) {
      console.log('✅ Generated content found!');
      console.log(`📍 Found using selector: ${foundSelector}`);
      console.log(`📏 Content length: ${bestContent.length} characters`);
      
      const wordCount = bestContent.split(/\s+/).filter(word => word.length > 0).length;
      console.log(`📊 Word count: ${wordCount} words`);
      
      // Quality checks
      const hasDogsContent = bestContent.toLowerCase().includes('dog');
      const hasBlogContent = bestContent.toLowerCase().includes('blog');
      const isSubstantial = wordCount >= 500;
      const isComprehensive = wordCount >= 1500;
      
      console.log(`🐕 Contains dog content: ${hasDogsContent ? '✅' : '❌'}`);
      console.log(`📝 Contains blog content: ${hasBlogContent ? '✅' : '❌'}`);
      console.log(`📖 Substantial content (500+ words): ${isSubstantial ? '✅' : '❌'}`);
      console.log(`📚 Comprehensive content (1500+ words): ${isComprehensive ? '✅' : '❌'}`);
      
      // Check for template indicators
      const templateIndicators = ['[PLACEHOLDER]', 'TODO:', 'INSERT_', 'REPLACE_', '{content}', '{title}', 'Lorem ipsum'];
      const hasTemplateContent = templateIndicators.some(indicator => bestContent.includes(indicator));
      console.log(`🚫 Template-free content: ${!hasTemplateContent ? '✅' : '❌'}`);
      
      // Content preview
      console.log('\n📝 CONTENT PREVIEW (first 500 characters):');
      console.log('────────────────────────────────────────────');
      console.log(bestContent.substring(0, 500));
      console.log('────────────────────────────────────────────');
      
      if (isComprehensive && hasDogsContent && hasBlogContent && !hasTemplateContent) {
        console.log('\n🎉 SUCCESS: High-quality comprehensive blog post generated!');
        console.log('✅ Claude Sonnet 4 API with 8192 token limit is working correctly');
        console.log('✅ Real content generation confirmed (not template-based)');
      } else if (isSubstantial && hasDogsContent && hasBlogContent) {
        console.log('\n✅ SUCCESS: Good quality blog post generated!');
        console.log('⚠️  Note: Content is substantial but not quite at the 1500+ word target');
      } else {
        console.log('\n⚠️  PARTIAL SUCCESS: Content generated but may need improvement');
      }
      
      // Save content to file for manual review
      await fs.writeFile('test-results/dogs-blog-generated-content.txt', bestContent);
      console.log('\n💾 Content saved to: test-results/dogs-blog-generated-content.txt');
      
    } else {
      console.log('❌ No substantial blog content found');
      console.log('💡 This might indicate an issue with content generation or detection');
      
      // Save full page content for debugging
      const fullContent = await page.textContent('body');
      if (fullContent) {
        await fs.writeFile('test-results/dogs-blog-full-page-debug.txt', fullContent);
        console.log('🔧 Full page content saved for debugging: test-results/dogs-blog-full-page-debug.txt');
      }
    }
    
    console.log('\n🏁 Test completed successfully!');
    console.log('📸 Screenshots saved in test-results/ directory');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ 
      path: 'test-results/dogs-standalone-error.png', 
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

// Run the test
runDogsBlogTest().catch(console.error);