const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Navigating to create page...');
  await page.goto('https://agentic-marketing-generator.netlify.app/create');
  
  console.log('📝 Selecting Blog Post...');
  await page.click('text=Blog Post');
  
  console.log('✍️ Filling form...');
  await page.fill('input[placeholder*="topic"]', 'dogs with blog');
  await page.fill('textarea[placeholder*="audience"]', 'Pet owners and dog enthusiasts who want to share their dog\'s adventures online');
  await page.fill('textarea[placeholder*="goals"]', 'Help pet owners start successful dog blogs that build community and potentially generate income');
  await page.fill('input[placeholder*="tone"]', 'Friendly and informative');
  
  console.log('🎯 Submitting form...');
  await page.click('button[type="submit"]');
  
  console.log('⏳ Waiting for workflow to complete...');
  await page.waitForTimeout(60000); // Wait 1 minute
  
  await page.screenshot({ path: 'dogs-blog-test.png', fullPage: true });
  console.log('📸 Screenshot saved as dogs-blog-test.png');
  
  await browser.close();
})();