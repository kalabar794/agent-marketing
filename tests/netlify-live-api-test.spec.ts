import { test, expect } from '@playwright/test';

test.describe('Netlify Live API Test', () => {
  test('should call live Netlify API to verify Claude integration works in production', async ({ request }) => {
    console.log('🎯 NETLIFY LIVE API TEST: Testing Claude API on production deployment...');
    
    const payload = {
      contentType: 'blog',
      topic: 'Production API Verification',
      audience: 'technical team',
      goals: 'verify production deployment works',
      tone: 'professional',
      length: 'short'
    };
    
    console.log('📤 Sending API request to live Netlify deployment...');
    
    const response = await request.post('https://agentic-marketing-generator.netlify.app/api/content/generate', {
      data: payload,
      timeout: 300000 // 5 minutes for production
    });
    
    console.log('📥 API response status:', response.status());
    
    if (response.status() !== 200) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      console.error('❌ Full response headers:', response.headers());
      throw new Error(`API returned ${response.status()}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('📊 API Response structure:', Object.keys(result));
    
    // Verify the response has the expected structure
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
    expect(result).toHaveProperty('content');
    
    if (result.content) {
      console.log('✅ Content generated successfully on Netlify!');
      console.log('📝 Content length:', result.content.length);
      console.log('📝 Content preview:', result.content.substring(0, 300) + '...');
      
      // Verify content is real AI-generated content
      expect(result.content.length).toBeGreaterThan(200);
      expect(result.content).not.toContain('placeholder');
      expect(result.content).not.toContain('test-key');
      expect(result.content).not.toContain('Connection error');
      
      // Verify it's actually about our topic
      expect(result.content.toLowerCase()).toContain('production');
    } else {
      console.error('❌ No content in response:', result);
      throw new Error('API response missing content field');
    }
    
    console.log('🏆 SUCCESS! Claude API is working on Netlify production!');
  });
});