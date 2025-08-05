import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationRequest } from '@/types/content';

// Force Node.js runtime for Anthropic SDK compatibility
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Testing workflow instantiation...');
    
    // Test 1: Import check
    try {
      console.log('✅ Test 1: Basic imports successful');
    } catch (error) {
      return NextResponse.json({ error: 'Import failed', details: error instanceof Error ? error.message : String(error) });
    }

    // Test 2: Config validation
    try {
      const { validateConfigAtRuntime } = await import('@/lib/config');
      validateConfigAtRuntime();
      console.log('✅ Test 2: Config validation successful');
    } catch (error) {
      return NextResponse.json({ error: 'Config validation failed', details: error instanceof Error ? error.message : String(error) });
    }

    // Test 3: EnhancedContentWorkflow import
    try {
      const { EnhancedContentWorkflow } = await import('@/lib/enhanced-workflow');
      console.log('✅ Test 3: EnhancedContentWorkflow import successful');
      
      // Test 4: EnhancedContentWorkflow instantiation
      const testRequest: ContentGenerationRequest = {
        contentType: 'blog',
        topic: 'Test Topic',
        audience: 'Test Audience',
        goals: ['test']
      };
      
      const workflow = new EnhancedContentWorkflow(testRequest, {});
      console.log('✅ Test 4: EnhancedContentWorkflow instantiation successful');
      
      return NextResponse.json({ 
        success: true, 
        message: 'All tests passed!',
        tests: [
          'Basic imports',
          'Config validation', 
          'EnhancedContentWorkflow import',
          'EnhancedContentWorkflow instantiation'
        ]
      });
      
    } catch (error) {
      return NextResponse.json({ 
        error: 'EnhancedContentWorkflow failed', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    }

  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
}