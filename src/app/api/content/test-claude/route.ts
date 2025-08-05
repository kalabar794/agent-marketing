import { NextRequest, NextResponse } from 'next/server';
import { BaseAgent } from '@/lib/agents/base-agent';
import { ContentGenerationRequest } from '@/types/content';

// Force Node.js runtime for Anthropic SDK compatibility
export const runtime = 'nodejs';

// Simple test agent to verify Claude API works
class TestAgent extends BaseAgent {
  constructor() {
    super('test-agent');
  }

  public async execute(request: ContentGenerationRequest, context: any) {
    // Not used for this simple test
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, maxTokens = 100 } = body;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt parameter' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing Claude API with simple prompt...');
    
    // Create test agent and call Claude directly
    const testAgent = new TestAgent();
    
    const content = await testAgent['callLLM'](prompt, {
      maxTokens,
      temperature: 0.7,
      model: 'claude-3-haiku-20240307'
    });
    
    console.log('✅ Claude API test successful!');
    console.log('📝 Generated content length:', content.length);
    
    return NextResponse.json({
      success: true,
      content,
      model: 'claude-3-haiku-20240307',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Claude API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}