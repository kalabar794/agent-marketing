const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Checking dashboard for content...');
  await page.goto('https://agentic-marketing-generator.netlify.app/dashboard');
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'dashboard-check.png', fullPage: true });
  console.log('📸 Dashboard screenshot saved');
  
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('Dashboard content preview:');
  console.log(pageText.substring(0, 1000));
  
  await browser.close();
})();