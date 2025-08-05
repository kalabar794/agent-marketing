import { test, expect } from '@playwright/test';

test.describe('Simple Claude API Endpoint Test', () => {
  test('should verify Claude API works via simple test endpoint', async ({ request }) => {
    console.log('🎯 SIMPLE CLAUDE ENDPOINT TEST: Testing Claude API directly...');
    
    // Test the simple API endpoint I created
    const response = await request.post('https://agentic-marketing-generator.netlify.app/api/content/test-claude', {
      data: {
        prompt: 'Write exactly one sentence about AI content generation being fixed.',
        maxTokens: 50
      },
      timeout: 30000
    });
    
    console.log('📥 API response status:', response.status());
    
    if (response.status() !== 200) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`API returned ${response.status()}: ${errorText.substring(0, 500)}`);
    }
    
    const result = await response.json();
    console.log('📊 API Response:', result);
    
    // Verify the response structure
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('model');
    expect(result).toHaveProperty('timestamp');
    
    // Verify content quality
    expect(result.content).toBeTruthy();
    expect(result.content.length).toBeGreaterThan(20);
    expect(result.content).not.toContain('Connection error');
    expect(result.content).not.toContain('placeholder');
    expect(result.model).toBe('claude-3-haiku-20240307');
    
    console.log('✅ Simple Claude API endpoint is working!');
    console.log('📝 Generated content:', result.content);
    console.log('🏆 SUCCESS! Basic Claude API integration works on production!');
  });
});