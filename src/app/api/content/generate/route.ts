import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationRequest, AgentResponse, WorkflowStatus } from '@/types/content';
import { ContentWorkflow } from '@/lib/workflow';
import { EnhancedContentWorkflow } from '@/lib/enhanced-workflow';
import { config } from '@/lib/config';

// Force Node.js runtime for Anthropic SDK compatibility
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes (Netlify limit)

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
    
    // Config validation ensures API key is present - no demo mode needed
    console.log('🚀 Starting Real AI Content Workflow with validated API key');

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
    
    // Execute workflow synchronously within the serverless function
    console.log(`🔄 Starting workflow execution for ${workflowId}`);
    
    try {
      // Execute the workflow and wait for completion (within 5 minute Netlify limit)
      await enhancedWorkflow.executeWorkflowInBackground(workflowId);
      
      // Get the final status
      const finalStatus = await enhancedWorkflow.getStatus();
      
      console.log(`✅ Workflow completed successfully: ${workflowId}`);
      
      // Return the completed workflow
      return NextResponse.json({
        workflowId,
        status: finalStatus.status,
        workflowType: 'enhanced-synchronous',
        content: finalStatus.content,
        qualityScores: finalStatus.qualityScores,
        agents: finalStatus.agents,
        startTime: finalStatus.startTime,
        endTime: finalStatus.endTime,
        progress: finalStatus.progress,
        options: options
      }, { status: 200 });
      
    } catch (error) {
      console.error(`❌ Workflow execution failed for ${workflowId}:`, error);
      
      await enhancedWorkflow.markAsFailed(error instanceof Error ? error.message : 'Unknown error');
      
      return NextResponse.json({
        workflowId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        workflowType: 'enhanced-synchronous-failed',
        agents: [
          { agentId: 'market-researcher', status: 'failed', progress: 0 },
          { agentId: 'audience-analyzer', status: 'failed', progress: 0 },
          { agentId: 'ai-seo-optimizer', status: 'failed', progress: 0 },
          { agentId: 'content-strategist', status: 'failed', progress: 0 },
          { agentId: 'content-writer', status: 'failed', progress: 0 },
          { agentId: 'content-editor', status: 'failed', progress: 0 },
          { agentId: 'social-media-specialist', status: 'failed', progress: 0 },
          { agentId: 'landing-page-specialist', status: 'failed', progress: 0 },
          { agentId: 'performance-analyst', status: 'failed', progress: 0 }
        ],
        options: options
      }, { status: 500 });
    }

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

    // Try to load from persistent storage (Netlify Blobs + fallbacks)
    try {
      console.log(`🔍 Loading persisted status for workflow: ${workflowId}`);
      const persistedStatus = await EnhancedContentWorkflow.loadPersistedStatus(workflowId);
      if (persistedStatus) {
        console.log(`📊 Loaded persisted workflow status: ${persistedStatus.status}, progress: ${persistedStatus.progress}%`);
        
        // If the workflow is completed and has content, also try to load the content from Netlify Blobs
        if (persistedStatus.status === 'completed' && !persistedStatus.content) {
          try {
            const { NetlifyBlobsStorage } = await import('@/lib/storage/netlify-blobs-storage');
            const storage = new NetlifyBlobsStorage();
            const finalContent = await storage.getFinalContent(workflowId);
            const qualityReport = await storage.getQualityReport(workflowId);
            
            if (finalContent) {
              persistedStatus.content = finalContent;
              console.log(`📄 Loaded final content from Netlify Blobs for ${workflowId}`);
            }
            
            if (qualityReport) {
              persistedStatus.qualityScores = qualityReport;
              console.log(`📊 Loaded quality scores from Netlify Blobs for ${workflowId}`);
            }
          } catch (contentError) {
            console.warn(`Failed to load content from Netlify Blobs: ${contentError}`);
          }
        }
        
        return NextResponse.json({
          ...persistedStatus,
          workflowType: 'enhanced-background'
        });
      }
    } catch (error) {
      console.error('Failed to load persisted status:', error);
    }

    // If we can't find the workflow, it might be a completed workflow that was cleaned up
    // Check if the workflow ID looks valid (has timestamp) and isn't too old
    const timestampMatch = workflowId.match(/(\d+)/);
    if (timestampMatch) {
      const workflowTime = parseInt(timestampMatch[1]);
      const now = Date.now();
      const ageInMinutes = (now - workflowTime) / (1000 * 60);
      
      // If the workflow is recent (less than 2 hours), it was likely a real failure
      if (ageInMinutes < 120) {
        console.log(`❌ Workflow ${workflowId} not found and is recent (${Math.round(ageInMinutes)} min old) - likely failed due to API issues`);
        return NextResponse.json({
          id: workflowId,
          status: 'failed', 
          progress: 0,
          error: 'Workflow failed - API integration not working. No fallback content available.',
          workflowType: 'enhanced-background-failed',
          startTime: new Date(workflowTime),
          endTime: new Date(),
          estimatedTimeRemaining: 0,
          currentAgent: null,
          agents: [
            { agentId: 'market-researcher', status: 'failed', progress: 0 },
            { agentId: 'audience-analyzer', status: 'failed', progress: 0 },
            { agentId: 'ai-seo-optimizer', status: 'failed', progress: 0 },
            { agentId: 'content-strategist', status: 'failed', progress: 0 },
            { agentId: 'content-writer', status: 'failed', progress: 0 },
            { agentId: 'content-editor', status: 'failed', progress: 0 },
            { agentId: 'social-media-specialist', status: 'failed', progress: 0 },
            { agentId: 'landing-page-specialist', status: 'failed', progress: 0 },
            { agentId: 'performance-analyst', status: 'failed', progress: 0 }
          ],
          note: 'AI content generation failed. API integration requires fixing for real content generation.'
        });
      }
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