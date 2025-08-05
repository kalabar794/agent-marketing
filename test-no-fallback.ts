/**
 * Test to verify that agents properly fail when API calls don't work
 * This validates that no fallback content is returned when Claude API fails
 */

import { ContentStrategist } from './src/lib/agents/content-strategist.ts';
import { ContentGenerationRequest } from './src/types/content.ts';

async function testNoFallbackContent() {
  console.log('🧪 Testing that agents fail properly when API calls don\'t work...');
  
  // Store original API key
  const originalApiKey = process.env.ANTHROPIC_API_KEY;
  
  try {
    // Set invalid API key to force failure
    process.env.ANTHROPIC_API_KEY = 'sk-invalid-key-to-force-failure';
    
    const strategist = new ContentStrategist();
    
    const testRequest: ContentGenerationRequest = {
      contentType: 'blog',
      topic: 'Testing API Failure Handling',
      audience: 'Developers',
      goals: 'Verify no fallback content is returned'
    };
    
    console.log('🔥 Attempting content generation with invalid API key...');
    
    try {
      const result = await strategist.execute(testRequest, {});
      
      // If we get here without error, the test failed
      console.log('❌ TEST FAILED: Expected API failure but got result');
      console.log('❌ This suggests fallback content is still being returned');
      console.log('Result:', JSON.stringify(result, null, 2).substring(0, 500) + '...');
      return false;
      
    } catch (error) {
      // This is expected - agents should fail properly
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('✅ Expected error occurred:', errorMessage);
      
      // Verify the error is a proper API failure, not fallback content
      const lowerError = errorMessage.toLowerCase();
      const hasFallbackTerms = lowerError.includes('fallback') || 
                              lowerError.includes('generic') || 
                              lowerError.includes('placeholder') ||
                              lowerError.includes('default');
      
      const hasAPIFailureTerms = lowerError.includes('claude response') ||
                                lowerError.includes('api') ||
                                lowerError.includes('parse') ||
                                lowerError.includes('authentication') ||
                                lowerError.includes('unauthorized');
      
      if (hasFallbackTerms) {
        console.log('❌ TEST FAILED: Error message contains fallback-related terms');
        console.log('❌ This suggests fallback content mechanisms may still be present');
        return false;
      }
      
      if (hasAPIFailureTerms) {
        console.log('✅ TEST PASSED: Error indicates proper API failure handling');
        console.log('✅ No fallback content returned - system fails as expected');
        return true;
      }
      
      console.log('⚠️  TEST UNCLEAR: Error message doesn\'t clearly indicate API failure or fallback');
      console.log('Error:', errorMessage);
      return false;
    }
    
  } finally {
    // Restore original API key
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  }
}

// Run the test
testNoFallbackContent()
  .then(success => {
    if (success) {
      console.log('\n🎉 SUCCESS: No fallback content detected - agents fail properly!');
      console.log('✅ User directive "no fallback content ever" has been implemented correctly');
    } else {
      console.log('\n💥 FAILURE: Test indicates fallback content may still be present');
      console.log('❌ Additional work needed to remove all fallback mechanisms');
    }
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error);
    console.error('Stack:', error.stack);
  });