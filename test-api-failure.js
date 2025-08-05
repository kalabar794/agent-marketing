/**
 * Test script to verify that agents properly fail when API calls don't work
 * This validates that no fallback content is returned when Claude API fails
 */

const { ContentStrategist } = require('./src/lib/agents/content-strategist.ts');

async function testAPIFailure() {
  console.log('🧪 Testing API failure handling...');
  
  // Temporarily override the API key to force failure
  const originalApiKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'invalid-api-key-to-force-failure';
  
  try {
    const strategist = new ContentStrategist();
    
    const testRequest = {
      contentType: 'blog',
      topic: 'Testing API Failure',
      audience: 'Developers',
      goals: ['Test proper error handling']
    };
    
    // This should fail with proper error instead of returning fallback content
    const result = await strategist.execute(testRequest, {});
    
    // If we get here, something went wrong - we should have gotten an error
    console.log('❌ Test FAILED - expected API failure but got result:', result);
    console.log('❌ This indicates fallback content might still be present');
    return false;
    
  } catch (error) {
    // This is the expected behavior - proper error instead of fallback content
    console.log('✅ Expected API failure occurred:', error.message);
    
    // Check if the error message indicates proper failure (not fallback content)
    const errorMessage = error.message;
    const containsFallback = errorMessage.toLowerCase().includes('fallback') ||
                            errorMessage.toLowerCase().includes('generic') ||
                            errorMessage.toLowerCase().includes('placeholder');
    
    const isProperFailure = !containsFallback && 
                           (errorMessage.includes('Claude response') || 
                            errorMessage.includes('API') ||
                            errorMessage.includes('authentication'));
    
    if (isProperFailure) {
      console.log('✅ Test PASSED - proper API failure handling, no fallback content');
      return true;
    } else {
      console.log('❌ Test FAILED - error message suggests fallback content:', errorMessage);
      return false;
    }
    
  } finally {
    // Restore the original API key
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  }
}

// Run the test
if (require.main === module) {
  testAPIFailure()
    .then(success => {
      if (success) {
        console.log('🎉 All tests passed! No fallback content detected.');
        process.exit(0);
      } else {
        console.log('💥 Tests failed! Fallback content may still be present.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testAPIFailure };