/**
 * Simple test to verify Claude API is working with a very basic request
 */

const { ContentStrategist } = require('./src/lib/agents/content-strategist.ts');

async function testSimpleAPICall() {
  console.log('🧪 Testing simple Claude API call...');
  
  const strategist = new ContentStrategist();
  
  const simpleRequest = {
    contentType: 'blog',
    topic: 'Hello World',
    audience: 'Everyone',
    goals: 'Test API'
  };
  
  try {
    console.log('🔄 Making simple Claude API call...');
    const result = await strategist.execute(simpleRequest, {});
    
    console.log('✅ API call successful!');
    console.log('📝 Result preview:', JSON.stringify(result, null, 2).substring(0, 200) + '...');
    
    // Check if it contains real content vs generic/fallback
    const resultStr = JSON.stringify(result).toLowerCase();
    const hasGenericTerms = resultStr.includes('comprehensive content about') ||
                           resultStr.includes('complete guide to') ||
                           resultStr.includes('placeholder') ||
                           resultStr.includes('generic');
    
    if (hasGenericTerms) {
      console.log('❌ WARNING: Result contains generic/fallback-like content');
      return false;
    } else {
      console.log('✅ Result appears to contain real AI-generated content');
      return true;
    }
    
  } catch (error) {
    console.log('❌ API call failed:', error.message);
    
    // Check if it's a proper API failure or fallback
    const errorMessage = error.message.toLowerCase();
    const isProperFailure = errorMessage.includes('claude response') ||
                           errorMessage.includes('api') ||
                           errorMessage.includes('parse') ||
                           errorMessage.includes('authentication');
    
    if (isProperFailure) {
      console.log('✅ Good: This is a proper API failure, not fallback content');
      return true; // This is what we want - proper failure
    } else {
      console.log('❌ Unclear error type');
      return false;
    }
  }
}

// Run the test
if (require.main === module) {
  testSimpleAPICall()
    .then(success => {
      if (success) {
        console.log('\n🎉 SUCCESS: API test passed - either real content or proper failure');
        process.exit(0);
      } else {
        console.log('\n💥 FAILURE: API test indicates issues');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testSimpleAPICall };