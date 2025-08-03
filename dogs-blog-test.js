const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Navigating to create page...');
  await page.goto('https://agentic-marketing-generator.netlify.app/create');
  await page.waitForTimeout(3000);
  
  console.log('📝 Selecting Blog Post...');
  await page.click('text=Blog Post');
  await page.waitForTimeout(2000);
  
  console.log('✍️ Filling out the form...');
  
  // Content Topic
  await page.fill('textarea[placeholder*="AI in marketing"]', 'dogs with blog');
  
  // Target Audience  
  await page.fill('textarea[placeholder*="Marketing professionals"]', 'Pet owners and dog enthusiasts who want to share their dog\'s adventures online');
  
  // Content Goals
  await page.fill('textarea[placeholder*="Generate leads"]', 'Help pet owners start successful dog blogs that build community and potentially generate income');
  
  // Brand Tone
  await page.fill('textarea[placeholder*="Professional and authoritative"]', 'Friendly and informative');
  
  console.log('🎯 Starting content creation...');
  await page.click('button:has-text("Start Creating")');
  
  console.log('⏳ Waiting for workflow to complete (2 minutes)...');
  
  // Wait and take screenshots during process
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(15000); // Wait 15 seconds
    await page.screenshot({ path: `dogs-blog-progress-${i + 1}.png`, fullPage: true });
    console.log(`📸 Progress screenshot ${i + 1}/8 taken`);
  }
  
  await page.screenshot({ path: 'dogs-blog-final.png', fullPage: true });
  console.log('📸 Final screenshot saved');
  
  await browser.close();
})();