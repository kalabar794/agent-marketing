#!/usr/bin/env node

/**
 * Direct test of Claude API to verify it works with the current configuration
 */

const Anthropic = require('@anthropic-ai/sdk');

async function testClaudeAPI() {
  console.log('🧪 Testing Claude API directly...');
  
  // Check if we have an API key (from environment or .env)
  require('dotenv').config({ path: '.env.local' });
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No ANTHROPIC_API_KEY found in environment');
    console.log('📝 Create .env.local with:');
    console.log('ANTHROPIC_API_KEY=your_api_key_here');
    return false;
  }
  
  if (!apiKey.startsWith('sk-ant-api')) {
    console.error('❌ Invalid API key format. Should start with sk-ant-api');
    return false;
  }
  
  console.log('✅ API key found and has correct format');
  console.log(`🔑 Key: ${apiKey.substring(0, 20)}...`);
  
  try {
    const anthropic = new Anthropic({
      apiKey: apiKey
    });
    
    console.log('🔄 Making Claude API call...');
    
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 200,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: 'Write a single paragraph about AI marketing automation. Be specific and avoid generic phrases.'
      }]
    });
    
    const content = response.content[0];
    const text = content.type === 'text' ? content.text : 'No text content';
    
    console.log('✅ Claude API call successful!');
    console.log('📝 Response:');
    console.log('---');
    console.log(text);
    console.log('---');
    
    // Check if the response looks real vs generic
    const lowerText = text.toLowerCase();
    const hasGenericTerms = lowerText.includes('comprehensive') ||
                           lowerText.includes('complete guide') ||
                           lowerText.includes('placeholder') ||
                           lowerText.includes('generic content');
    
    if (hasGenericTerms) {
      console.log('⚠️  WARNING: Response contains generic terms, but this might be legitimate content');
    } else {
      console.log('✅ Response appears to be real AI-generated content');
    }
    
    console.log('\n🎉 SUCCESS: Claude API is working correctly!');
    return true;
    
  } catch (error) {
    console.error('❌ Claude API test failed:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('🔑 API key authentication failed - check if key is valid');
    } else if (error.message.includes('rate limit')) {
      console.log('⏰ Rate limit exceeded - wait and try again');
    } else if (error.message.includes('timeout')) {
      console.log('⏰ Request timed out - API might be slow');
    } else {
      console.log('🔍 Unexpected error - check network and API status');
    }
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testClaudeAPI()
    .then(success => {
      if (success) {
        console.log('\n🎯 RESULT: Claude API is working - the issue is likely in the application logic');
        process.exit(0);
      } else {
        console.log('\n💥 RESULT: Claude API is not working - need to fix API configuration');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testClaudeAPI };