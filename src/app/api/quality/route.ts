import { NextRequest, NextResponse } from 'next/server';
import { ContentWorkflow } from '@/lib/workflow';

export async function POST(request: NextRequest) {
  try {
    const { workflowId, action, feedback } = await request.json();
    
    if (!workflowId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: workflowId, action' },
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

    let result;
    
    switch (action) {
      case 'approve':
        result = await workflow.approveContent(feedback);
        break;
      case 'reject':
        result = await workflow.rejectContent(feedback);
        break;
      case 'request_revision':
        result = await workflow.requestRevision(feedback);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: approve, reject, or request_revision' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Quality control error:', error);
    return NextResponse.json(
      { error: 'Failed to process quality control action' },
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

    const qualityReport = await workflow.getQualityReport();
    
    return NextResponse.json(qualityReport);

  } catch (error) {
    console.error('Quality report error:', error);
    return NextResponse.json(
      { error: 'Failed to get quality report' },
      { status: 500 }
    );
  }
}