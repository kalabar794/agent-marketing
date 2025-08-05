import { test, expect } from '@playwright/test';

test.describe('Direct API Test', () => {
  test('should call API endpoint directly to verify Claude integration', async ({ request }) => {
    console.log('🎯 DIRECT API TEST: Testing Claude API integration...');
    
    const payload = {
      contentType: 'blog',
      topic: 'AI API Testing',
      audience: 'developers',
      goals: 'verify Claude API works',
      tone: 'professional',
      length: 'short'
    };
    
    console.log('📤 Sending API request...');
    
    const response = await request.post('http://localhost:3000/api/content/generate', {
      data: payload,
      timeout: 120000 // 2 minutes
    });
    
    console.log('📥 API response status:', response.status());
    
    if (response.status() !== 200) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`API returned ${response.status()}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('📊 API Response keys:', Object.keys(result));
    
    // Verify the response has the expected structure
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
    expect(result).toHaveProperty('content');
    
    if (result.content) {
      console.log('✅ Content generated successfully!');
      console.log('📝 Content length:', result.content.length);
      console.log('📝 Content preview:', result.content.substring(0, 200) + '...');
      
      // Verify content is not empty or placeholder
      expect(result.content.length).toBeGreaterThan(100);
      expect(result.content).not.toContain('placeholder');
      expect(result.content).not.toContain('test-key');
    } else {
      console.error('❌ No content in response:', result);
      throw new Error('API response missing content field');
    }
    
    console.log('🏆 SUCCESS! Claude API is working properly!');
  });
});