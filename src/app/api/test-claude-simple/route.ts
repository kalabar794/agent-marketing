import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing simple Claude API call...');
    
    // Initialize Claude client  
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'invalid-key-test'
    });
    
    console.log('🔄 Making direct Claude API call...');
    
    // Make a very simple, fast API call
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 100, // Keep it small and fast
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: 'Write exactly one sentence about AI marketing. Be specific and avoid generic phrases.'
      }]
    });
    
    const content = response.content[0];
    const text = 'type' in content && content.type === 'text' ? content.text : 'No text content';
    
    console.log('✅ Claude API call successful!');
    console.log('📝 Response:', text);
    
    // Check if response looks real vs generic
    const lowerText = text.toLowerCase();
    const hasGenericTerms = lowerText.includes('comprehensive') ||
                           lowerText.includes('complete guide') ||
                           lowerText.includes('placeholder') ||
                           lowerText.includes('generic content');
    
    return NextResponse.json({
      success: true,
      message: 'Claude API is working correctly',
      response: text,
      isGeneric: hasGenericTerms,
      analysis: hasGenericTerms ? 'WARNING: Response seems generic' : 'Response appears to be real AI content'
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Claude API test failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isAuthError = errorMessage.toLowerCase().includes('authentication') ||
                       errorMessage.toLowerCase().includes('api key') ||
                       errorMessage.toLowerCase().includes('unauthorized');
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      analysis: isAuthError ? 'API key authentication failed' : 'Other API error',
      message: 'Claude API test failed - this is expected behavior with no fallback content'
    }, { status: 500 });
  }
}