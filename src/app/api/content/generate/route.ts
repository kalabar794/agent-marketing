import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationRequest, AgentResponse, WorkflowStatus } from '@/types/content';
import { ContentWorkflow } from '@/lib/workflow';
import { EnhancedContentWorkflow } from '@/lib/enhanced-workflow';

// Enable Netlify Background Functions (15-minute timeout instead of 10 seconds)
export const config = {
  runtime: 'nodejs18.x',
  maxDuration: 900, // 15 minutes in seconds
};

export async function POST(request: NextRequest) {
  try {
    const body: ContentGenerationRequest = await request.json();
    
    // Validate required fields
    if (!body.contentType || !body.topic || !body.audience || !body.goals) {
      return NextResponse.json(
        { error: 'Missing required fields: contentType, topic, audience, goals' },
        { status: 400 }
      );
    }

    // Generate workflow ID immediately
    const workflowId = `enhanced-workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('🎭 Using Demo Mode - ANTHROPIC_API_KEY not configured');
      
      // For demo mode, simulate background processing
      setTimeout(async () => {
        try {
          const enhancedWorkflow = new EnhancedContentWorkflow(body, { demoMode: true });
          await enhancedWorkflow.simulateDemoWorkflow(workflowId);
        } catch (error) {
          console.error('Demo workflow simulation failed:', error);
        }
      }, 100);
      
      return NextResponse.json({
        workflowId,
        status: 'started',
        workflowType: 'demo',
        estimatedTime: 60, // 1 minute demo
        agents: [
          { agentId: 'market-researcher', status: 'pending', progress: 0 },
          { agentId: 'content-strategist', status: 'pending', progress: 0 },
          { agentId: 'content-writer', status: 'pending', progress: 0 },
          { agentId: 'ai-seo-optimizer', status: 'pending', progress: 0 },
          { agentId: 'content-editor', status: 'pending', progress: 0 }
        ],
        options: {
          priorityMode: 'demo',
          enableOptimization: false,
          demoMode: true
        }
      });
    }

    // Extract workflow options from request
    const options = {
      priorityMode: (body.priorityMode as 'speed' | 'balanced' | 'quality') || 'balanced',
      maxExecutionTime: body.maxExecutionTime || 900, // 15 minutes default  
      enableOptimization: body.enableOptimization !== false,
      maxOptimizationCycles: body.maxOptimizationCycles || 2,
      enableFallbacks: body.enableFallbacks !== false
    };
    
    console.log('🚀 Starting Background Content Workflow');
    
    // Create enhanced workflow instance
    const enhancedWorkflow = new EnhancedContentWorkflow(body, options);
    
    // Store workflow instance for later retrieval
    EnhancedContentWorkflow.setInstance(workflowId, enhancedWorkflow);
    
    // Store initial status for persistence
    await enhancedWorkflow.persistStatus();
    
    // Trigger background processing immediately (non-blocking)
    setTimeout(async () => {
      try {
        console.log(`🔄 Starting background processing for workflow ${workflowId}`);
        await enhancedWorkflow.executeWorkflowInBackground(workflowId);
        console.log(`✅ Background processing completed for workflow ${workflowId}`);
      } catch (error) {
        console.error(`❌ Background processing failed for workflow ${workflowId}:`, error);
        enhancedWorkflow.markAsFailed(error instanceof Error ? error.message : 'Unknown error');
      }
    }, 100); // Start immediately but asynchronously
    
    // Return 202 Accepted immediately (standard background function pattern)
    return NextResponse.json({
      workflowId,
      status: 'started',
      workflowType: 'enhanced-background',
      estimatedTime: options.maxExecutionTime / 60, // Convert to minutes
      agents: [
        { agentId: 'market-researcher', status: 'pending', progress: 0 },
        { agentId: 'audience-analyzer', status: 'pending', progress: 0 },
        { agentId: 'ai-seo-optimizer', status: 'pending', progress: 0 },
        { agentId: 'content-strategist', status: 'pending', progress: 0 },
        { agentId: 'content-writer', status: 'pending', progress: 0 },
        { agentId: 'content-editor', status: 'pending', progress: 0 },
        { agentId: 'social-media-specialist', status: 'pending', progress: 0 },
        { agentId: 'landing-page-specialist', status: 'pending', progress: 0 },
        { agentId: 'performance-analyst', status: 'pending', progress: 0 }
      ],
      options: options
    }, { status: 202 }); // 202 Accepted for background processing

  } catch (error) {
    console.error('Content generation startup error:', error);
    return NextResponse.json(
      { error: 'Failed to start content generation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    
    if (!workflowId) {
      return NextResponse.json(
        { error: 'Missing workflowId parameter' },
        { status: 400 }
      );
    }

    console.log(`📊 Status check for workflow: ${workflowId}`);

    // Try to find enhanced workflow first (in-memory)
    const enhancedWorkflow = EnhancedContentWorkflow.getInstance(workflowId);
    if (enhancedWorkflow) {
      const status = await enhancedWorkflow.getStatus();
      console.log(`📊 Enhanced workflow status: ${status.status}, progress: ${status.progress}%`);
      return NextResponse.json({
        ...status,
        workflowType: 'enhanced-background'
      });
    }

    // Try to load from persistent storage
    try {
      const persistedStatus = await EnhancedContentWorkflow.loadPersistedStatus(workflowId);
      if (persistedStatus) {
        console.log(`📊 Loaded persisted workflow status: ${persistedStatus.status}, progress: ${persistedStatus.progress}%`);
        return NextResponse.json({
          ...persistedStatus,
          workflowType: 'enhanced-background'
        });
      }
    } catch (error) {
      console.error('Failed to load persisted status:', error);
    }

    // Check if API key is configured (demo mode fallback)
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('🎭 No API key - returning demo content');
      return NextResponse.json({
        id: workflowId,
        status: 'completed',
        progress: 100,
        workflowType: 'demo',
        agents: [
          { agentId: 'market-researcher', status: 'completed', progress: 100 },
          { agentId: 'content-strategist', status: 'completed', progress: 100 },
          { agentId: 'content-writer', status: 'completed', progress: 100 },
          { agentId: 'ai-seo-optimizer', status: 'completed', progress: 100 },
          { agentId: 'content-editor', status: 'completed', progress: 100 }
        ],
        startTime: new Date(Date.now() - 60000), // 1 minute ago
        endTime: new Date(),
        estimatedTimeRemaining: 0,
        content: {
          id: 'demo-content',
          title: 'Demo Content: AI-Powered Marketing Revolution',
          content: `# The Future of AI-Powered Marketing

## Introduction
Artificial Intelligence is transforming the marketing landscape, offering unprecedented opportunities for businesses to connect with their audiences in meaningful ways.

## Key Benefits
- **Personalization at Scale**: AI enables hyper-personalized content delivery
- **Data-Driven Insights**: Advanced analytics reveal customer behavior patterns  
- **Automation Efficiency**: Streamlined workflows increase productivity
- **ROI Optimization**: Smart budget allocation maximizes campaign effectiveness

## Implementation Strategies
1. Start with clear objectives and KPIs
2. Integrate AI tools gradually into existing workflows
3. Train teams on new technologies and processes
4. Monitor performance and optimize continuously

## Conclusion
The integration of AI in marketing represents a paradigm shift that forward-thinking businesses cannot afford to ignore. By embracing these technologies now, companies position themselves for sustained growth and competitive advantage.

*Ready to transform your marketing with AI? Contact us to learn more about our comprehensive solutions.*`,
          summary: 'Comprehensive guide to implementing AI-powered marketing strategies for modern businesses.',
          seoKeywords: ['AI marketing', 'digital transformation', 'marketing automation', 'data analytics'],
          readabilityScore: 85,
          platforms: [],
          metadata: {
            contentType: 'blog',
            generationMethod: 'demo-mode',
            totalAgents: 5,
            executionTime: 60000,
            qualityMode: 'demo'
          }
        },
        qualityScores: {
          overall: 0.9,
          content: 0.88,
          seo: 0.92,
          engagement: 0.87,
          brand: 0.85
        }
      });
    }

    // Fall back to legacy workflow
    const legacyWorkflow = ContentWorkflow.getInstance(workflowId);
    if (legacyWorkflow) {
      const status = await legacyWorkflow.getStatus();
      return NextResponse.json({
        ...status,
        workflowType: 'legacy'
      });
    }

    // If workflow not found, return a 'running' status for recent workflows
    // This handles the case where background processing might not have initialized yet
    const workflowTimestamp = workflowId.match(/(\d+)/)?.[1];
    if (workflowTimestamp) {
      const workflowTime = parseInt(workflowTimestamp);
      const now = Date.now();
      const age = now - workflowTime;
      
      // If workflow is less than 30 seconds old, assume it's still initializing
      if (age < 30000) {
        console.log(`⏳ Workflow ${workflowId} is initializing...`);
        return NextResponse.json({
          id: workflowId,
          status: 'running',
          progress: 5,
          workflowType: 'enhanced-background',
          agents: [
            { agentId: 'market-researcher', status: 'pending', progress: 0 },
            { agentId: 'audience-analyzer', status: 'pending', progress: 0 },
            { agentId: 'ai-seo-optimizer', status: 'pending', progress: 0 },
            { agentId: 'content-strategist', status: 'pending', progress: 0 },
            { agentId: 'content-writer', status: 'pending', progress: 0 },
            { agentId: 'content-editor', status: 'pending', progress: 0 },
            { agentId: 'social-media-specialist', status: 'pending', progress: 0 },
            { agentId: 'landing-page-specialist', status: 'pending', progress: 0 },
            { agentId: 'performance-analyst', status: 'pending', progress: 0 }
          ],
          startTime: new Date(workflowTime),
          estimatedTimeRemaining: 900 // 15 minutes
        });
      }
    }

    console.log(`❌ Workflow ${workflowId} not found`);
    return NextResponse.json(
      { error: 'Workflow not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Workflow status error:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow status' },
      { status: 500 }
    );
  }
}