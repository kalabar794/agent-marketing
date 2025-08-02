import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationRequest, AgentResponse, WorkflowStatus } from '@/types/content';
import { ContentWorkflow } from '@/lib/workflow';

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

    // Create new workflow instance
    const workflow = new ContentWorkflow(body);
    
    // Start the content generation workflow
    const workflowId = await workflow.start();
    
    return NextResponse.json({
      workflowId,
      status: 'started',
      estimatedTime: workflow.getEstimatedTime(),
      agents: workflow.getAgentPipeline()
    });

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

    const workflow = ContentWorkflow.getInstance(workflowId);
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const status = await workflow.getStatus();
    
    return NextResponse.json(status);

  } catch (error) {
    console.error('Workflow status error:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow status' },
      { status: 500 }
    );
  }
}