const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Navigating to workflow page...');
  await page.goto('https://agentic-marketing-generator.netlify.app/workflow');
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'workflow-current.png', fullPage: true });
  console.log('📸 Workflow screenshot saved');
  
  // Try to find any content or results
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('Page content preview:');
  console.log(pageText.substring(0, 500) + '...');
  
  await browser.close();
})();