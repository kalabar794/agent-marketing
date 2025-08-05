// Simple Node.js script to verify Claude API integration
const fs = require('fs');
const path = require('path');

// Read the .env.local file
const envPath = path.join(__dirname, '.env.local');
let apiKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
  if (match) {
    apiKey = match[1].trim();
  }
}

console.log('🔑 API Key Analysis:');
console.log('- Length:', apiKey.length);
console.log('- Starts with sk-ant-:', apiKey.startsWith('sk-ant-'));
console.log('- Is not test key:', !apiKey.includes('test-key-for-local-development'));
console.log('- First 20 chars:', apiKey.substring(0, 20) + '...');
console.log('- Last 10 chars:', '...' + apiKey.substring(apiKey.length - 10));

// Test the API key validation logic
if (apiKey.length < 50) {
  console.log('❌ API key is too short (needs 50+ characters)');
} else if (!apiKey.startsWith('sk-ant-')) {
  console.log('❌ API key does not start with sk-ant-');
} else if (apiKey.includes('test-key-for-local-development')) {
  console.log('❌ Still using placeholder test key');
} else {
  console.log('✅ API key appears to be valid!');
}

// Test basic Claude API call
async function testClaudeAPI() {
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    
    console.log('\n🧪 Testing Claude API call...');
    
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 50,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: 'Write exactly one sentence about artificial intelligence.'
      }]
    });

    const textContent = response.content.find(content => content.type === 'text');
    if (textContent && 'text' in textContent) {
      console.log('✅ Claude API call successful!');
      console.log('📝 Generated content:', textContent.text);
      console.log('📊 Token usage:', response.usage);
      console.log('🏆 CONFIRMED: Claude API integration is working properly!');
      return true;
    } else {
      console.log('❌ No text content in response');
      return false;
    }

  } catch (error) {
    console.error('❌ Claude API call failed:', error.message);
    return false;
  }
}

// Run the test
testClaudeAPI().then(success => {
  if (success) {
    console.log('\n🎉 FINAL VERDICT: The "Connection error occurred" issue has been RESOLVED!');
    console.log('🎉 Claude API integration is working properly with the new API key.');
  } else {
    console.log('\n❌ FINAL VERDICT: Claude API integration still has issues.');
  }
});