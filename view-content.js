const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Navigating to workflow page...');
  await page.goto('https://agentic-marketing-generator.netlify.app/workflow');
  await page.waitForTimeout(3000);
  
  console.log('👁️ Clicking View Final Content...');
  await page.click('button:has-text("View Final Content")');
  await page.waitForTimeout(5000);
  
  console.log('📄 Extracting content...');
  const content = await page.evaluate(() => {
    return document.body.innerText;
  });
  
  console.log('Content length:', content.length, 'characters');
  console.log('Word count estimate:', content.split(' ').length, 'words');
  
  await page.screenshot({ path: 'dogs-blog-content.png', fullPage: true });
  console.log('📸 Content screenshot saved');
  
  // Save content to file
  require('fs').writeFileSync('dogs-blog-content.txt', content);
  console.log('💾 Content saved to dogs-blog-content.txt');
  
  await browser.close();
})();