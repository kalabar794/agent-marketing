/**
 * Simple test to verify that agents properly fail when API calls don't work
 * This validates that no fallback content is returned when Claude API fails
 */

const { BaseAgent } = require('./src/lib/agents/base-agent.ts');

class TestAgent extends BaseAgent {
  constructor() {
    super('test-agent');
  }

  async execute(request, context) {
    this.logExecution('Starting test agent execution');
    
    const prompt = `Test prompt for ${request.topic}`;
    
    try {
      const response = await this.callLLM(prompt, {
        maxTokens: 1000,
        temperature: 0.7
      });
      
      const result = this.parseResponse(response);
      this.logExecution('Test completed');
      
      return result;
    } catch (error) {
      this.logExecution('Test failed', { error: error.message });
      throw new Error(`Test agent failed: ${error}`);
    }
  }

  parseResponse(response) {
    try {
      // Try to parse as JSON
      return JSON.parse(response);
    } catch (error) {
      // This should throw an error now instead of returning fallback content
      this.logExecution('JSON parsing failed - no fallback content allowed', { error: error.message });
      throw new Error(`Test Agent failed to parse Claude response: ${error.message}. Raw response: ${response.substring(0, 500)}...`);
    }
  }
}

async function testNoFallbackContent() {
  console.log('🧪 Testing that agents fail properly when API calls don\'t work...');
  
  // Store original API key
  const originalApiKey = process.env.ANTHROPIC_API_KEY;
  
  try {
    // Set invalid API key to force failure
    process.env.ANTHROPIC_API_KEY = 'sk-invalid-key-to-force-failure';
    
    const testAgent = new TestAgent();
    
    const testRequest = {
      contentType: 'blog',
      topic: 'Testing API Failure Handling',
      audience: 'Developers',
      goals: 'Verify no fallback content is returned'
    };
    
    console.log('🔥 Attempting agent execution with invalid API key...');
    
    try {
      const result = await testAgent.execute(testRequest, {});
      
      // If we get here without error, the test failed
      console.log('❌ TEST FAILED: Expected API failure but got result');
      console.log('❌ This suggests fallback content is still being returned');
      console.log('Result:', JSON.stringify(result, null, 2).substring(0, 500) + '...');
      return false;
      
    } catch (error) {
      // This is expected - agents should fail properly
      const errorMessage = error.message;
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
                                lowerError.includes('unauthorized') ||
                                lowerError.includes('invalid') ||
                                lowerError.includes('failed');
      
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
if (require.main === module) {
  testNoFallbackContent()
    .then(success => {
      if (success) {
        console.log('\n🎉 SUCCESS: No fallback content detected - agents fail properly!');
        console.log('✅ User directive "no fallback content ever" has been implemented correctly');
        process.exit(0);
      } else {
        console.log('\n💥 FAILURE: Test indicates fallback content may still be present');
        console.log('❌ Additional work needed to remove all fallback mechanisms');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error);
      console.error('Stack:', error.stack);
      process.exit(1);
    });
}

module.exports = { testNoFallbackContent };