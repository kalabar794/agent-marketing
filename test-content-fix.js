#!/usr/bin/env node

const { chromium } = require('playwright');

async function testContentFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Navigating to create page...');
    await page.goto('http://localhost:3000/create');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take screenshot to see the form
    await page.screenshot({ path: 'create-page-debug.png' });
    console.log('📸 Screenshot saved: create-page-debug.png');
    
    // Try to find form elements and log what we find
    const formElements = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select')).map(s => ({
        name: s.name,
        id: s.id,
        options: Array.from(s.options).map(o => ({ value: o.value, text: o.text }))
      }));
      
      const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
        name: i.name,
        id: i.id,
        type: i.type,
        placeholder: i.placeholder
      }));
      
      const textareas = Array.from(document.querySelectorAll('textarea')).map(t => ({
        name: t.name,
        id: t.id,
        placeholder: t.placeholder
      }));
      
      return { selects, inputs, textareas };
    });
    
    console.log('📋 Form elements found:', JSON.stringify(formElements, null, 2));
    
    // Try to test workflow creation with a simple direct API call
    console.log('🔬 Testing API directly...');
    
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/content/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: 'blog',
            topic: 'Dog Training',
            audience: 'Pet Owners',
            tone: 'friendly',
            goals: 'Create engaging content about dog training'
          })
        });
        const data = await res.json();
        return { status: res.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📊 API Response:', response);
    
    if (response.data?.workflowId) {
      console.log('✅ Workflow started successfully!');
      console.log('🆔 Workflow ID:', response.data.workflowId);
      
      // Navigate to workflow page
      await page.goto(`http://localhost:3000/workflow?id=${response.data.workflowId}`);
      await page.waitForTimeout(5000);
      
      // Take workflow screenshot
      await page.screenshot({ path: 'workflow-page-debug.png' });
      console.log('📸 Workflow screenshot saved: workflow-page-debug.png');
      
      // Monitor workflow for completion
      let attempts = 0;
      const maxAttempts = 24; // 2 minutes
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`⏳ Checking workflow completion (${attempts}/${maxAttempts})...`);
        
        const status = await page.evaluate(async (workflowId) => {
          try {
            const res = await fetch(`/api/content/generate?workflowId=${workflowId}`);
            const data = await res.json();
            return data;
          } catch (error) {
            return { error: error.message };
          }
        }, response.data.workflowId);
        
        console.log(`📊 Status: ${status.status}, Progress: ${status.progress}%`);
        
        if (status.status === 'completed' && status.content) {
          console.log('🎉 Workflow completed!');
          console.log('📝 Title:', status.content.title);
          console.log('📄 Content preview:', status.content.content?.substring(0, 200) + '...');
          
          // Check if title/content are literal strings
          if (status.content.title === 'title' || status.content.title === 'Title') {
            console.log('❌ BUG CONFIRMED: Title is literal string');
          } else {
            console.log('✅ Title looks correct');
          }
          
          if (status.content.content === 'content' || status.content.content === 'Content') {
            console.log('❌ BUG CONFIRMED: Content is literal string');  
          } else {
            console.log('✅ Content looks correct');
          }
          
          break;
        }
        
        await page.waitForTimeout(5000);
      }
      
      // Final screenshot
      await page.screenshot({ path: 'workflow-final-debug.png' });
      console.log('📸 Final screenshot saved: workflow-final-debug.png');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test-error-debug.png' });
  } finally {
    await browser.close();
  }
}

testContentFix();