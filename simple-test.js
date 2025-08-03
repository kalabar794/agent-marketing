const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Navigating to create page...');
  await page.goto('https://agentic-marketing-generator.netlify.app/create');
  await page.waitForTimeout(3000);
  
  console.log('📝 Looking for Blog Post card...');
  await page.click('.rounded-lg:has-text("Blog Post")');
  await page.waitForTimeout(3000);
  
  // Wait longer and see what happens
  await page.waitForTimeout(30000);
  
  await page.screenshot({ path: 'current-page.png', fullPage: true });
  console.log('📸 Screenshot saved');
  
  await browser.close();
})();