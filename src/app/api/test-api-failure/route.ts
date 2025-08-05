import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationRequest } from '@/types/content';

// Force Node.js runtime for Anthropic SDK compatibility
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ContentGenerationRequest;
    console.log('🧪 Testing API failure handling...');
    
    // Import the workflow
    const { EnhancedContentWorkflow } = await import('@/lib/enhanced-workflow');
    
    // Create a workflow with an invalid API key to force failure
    const testRequest: ContentGenerationRequest = {
      contentType: body.contentType || 'blog',
      topic: body.topic || 'Test API Failure Topic',
      audience: body.audience || 'Test Audience',
      goals: body.goals || ['test API failure handling']
    };
    
    // Temporarily override the API key to an invalid one to force failure
    const originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'invalid-api-key-to-force-failure';
    
    try {
      const workflow = new EnhancedContentWorkflow(testRequest, {});
      
      // This should fail with proper error instead of returning fallback content
      const result = await workflow.execute();
      
      // If we get here, something went wrong - we should have gotten an error
      return NextResponse.json({ 
        error: 'Test failed - expected API failure but workflow succeeded',
        result: result,
        message: 'This indicates fallback content might still be present'
      }, { status: 500 });
      
    } catch (error) {
      // This is the expected behavior - proper error instead of fallback content
      console.log('✅ Expected API failure occurred:', error instanceof Error ? error.message : String(error));
      
      // Check if the error message indicates proper failure (not fallback content)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isProperFailure = !errorMessage.toLowerCase().includes('fallback') && 
                             !errorMessage.toLowerCase().includes('generic') &&
                             !errorMessage.toLowerCase().includes('placeholder');
      
      return NextResponse.json({ 
        success: true,
        message: 'API failure handled correctly - no fallback content returned',
        error: errorMessage,
        isProperFailure: isProperFailure,
        testPassed: isProperFailure
      });
      
    } finally {
      // Restore the original API key
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    }
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test setup failed', 
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}