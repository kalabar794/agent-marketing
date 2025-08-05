import { test, expect } from '@playwright/test';

test.describe('Simple Claude API Test', () => {
  test('should verify Claude API key works by testing base agent directly', async ({ page }) => {
    console.log('🎯 SIMPLE CLAUDE TEST: Testing Claude API integration directly...');
    
    // Navigate to a simple page to get a browser context
    await page.goto('https://agentic-marketing-generator.netlify.app/');
    
    // Test Claude API directly via browser evaluation
    const apiTest = await page.evaluate(async () => {
      try {
        // Import the BaseAgent and test it directly
        const response = await fetch('/api/content/test-claude', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: 'Write a single sentence about AI content generation.',
            maxTokens: 50
          })
        });
        
        if (!response.ok) {
          return { 
            success: false, 
            error: `HTTP ${response.status}: ${await response.text()}` 
          };
        }
        
        const result = await response.json();
        return { 
          success: true, 
          content: result.content,
          length: result.content ? result.content.length : 0
        };
        
      } catch (error) {
        return { 
          success: false, 
          error: error.message 
        };
      }
    });
    
    console.log('📊 API Test Result:', apiTest);
    
    if (apiTest.success) {
      console.log('✅ Claude API is working!');
      console.log('📝 Generated content:', apiTest.content);
      console.log('📝 Content length:', apiTest.length);
      
      expect(apiTest.content).toBeTruthy();
      expect(apiTest.length).toBeGreaterThan(10);
      expect(apiTest.content).not.toContain('Connection error');
      
      console.log('🏆 SUCCESS! Claude API integration is working properly!');
    } else {
      console.error('❌ Claude API test failed:', apiTest.error);
      throw new Error(`Claude API test failed: ${apiTest.error}`);
    }
  });
});