import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationRequest, AgentResponse, WorkflowStatus } from '@/types/content';
import { ContentWorkflow } from '@/lib/workflow';
import { EnhancedContentWorkflow } from '@/lib/enhanced-workflow';

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

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('🎭 Using Demo Mode - ANTHROPIC_API_KEY not configured');
      
      // Generate a demo workflow ID
      const demoWorkflowId = `demo-workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return NextResponse.json({
        workflowId: demoWorkflowId,
        status: 'started',
        workflowType: 'demo',
        estimatedTime: 1, // 1 minute demo
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

    // Check for enhanced workflow flag or use enhanced by default
    const useEnhanced = body.useEnhanced !== false; // Default to enhanced
    
    if (useEnhanced) {
      console.log('🚀 Using Enhanced Content Workflow');
      
      // Extract workflow options from request
      const options = {
        priorityMode: (body.priorityMode as 'speed' | 'balanced' | 'quality') || 'balanced',
        maxExecutionTime: body.maxExecutionTime || 900, // 15 minutes default
        enableOptimization: body.enableOptimization !== false,
        maxOptimizationCycles: body.maxOptimizationCycles || 2,
        enableFallbacks: body.enableFallbacks !== false
      };
      
      // Create enhanced workflow instance
      const enhancedWorkflow = new EnhancedContentWorkflow(body, options);
      
      // Start the enhanced content generation workflow
      const workflowId = await enhancedWorkflow.start();
      
      const status = await enhancedWorkflow.getStatus();
      
      return NextResponse.json({
        workflowId,
        status: 'started',
        workflowType: 'enhanced',
        estimatedTime: status.estimatedTimeRemaining,
        agents: status.agents,
        options: options
      });
    } else {
      console.log('📝 Using Legacy Content Workflow');
      
      // Create legacy workflow instance
      const workflow = new ContentWorkflow(body);
      
      // Start the legacy content generation workflow
      const workflowId = await workflow.start();
      
      return NextResponse.json({
        workflowId,
        status: 'started',
        workflowType: 'legacy',
        estimatedTime: workflow.getEstimatedTime(),
        agents: workflow.getAgentPipeline()
      });
    }

  } catch (error) {
    console.error('Content generation error:', error);
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

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not configured in production');
      return NextResponse.json({
        id: workflowId,
        status: 'demo',
        progress: 100,
        workflowType: 'demo',
        agents: [
          { agentId: 'market-researcher', status: 'completed', progress: 100 },
          { agentId: 'content-strategist', status: 'completed', progress: 100 },
          { agentId: 'content-writer', status: 'completed', progress: 100 },
          { agentId: 'ai-seo-optimizer', status: 'completed', progress: 100 },
          { agentId: 'content-editor', status: 'completed', progress: 100 }
        ],
        startTime: new Date(),
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
            executionTime: 0,
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

    // Try to find enhanced workflow first
    const enhancedWorkflow = EnhancedContentWorkflow.getInstance(workflowId);
    if (enhancedWorkflow) {
      const status = await enhancedWorkflow.getStatus();
      return NextResponse.json({
        ...status,
        workflowType: 'enhanced'
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