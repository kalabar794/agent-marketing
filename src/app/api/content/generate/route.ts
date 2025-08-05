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

    // Generate job ID in format expected by monitoring page
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚀 Creating background job: ${jobId}`);

    // Extract workflow options from request
    const options = {
      priorityMode: (body.priorityMode as 'speed' | 'balanced' | 'quality') || 'balanced',
      maxExecutionTime: body.maxExecutionTime || 900, // 15 minutes default  
      enableOptimization: body.enableOptimization !== false,
      maxOptimizationCycles: body.maxOptimizationCycles || 2,
      enableFallbacks: body.enableFallbacks !== false
    };
    
    // Initialize job storage
    const { getJobStorage } = await import('@/lib/storage/job-storage');
    const storage = getJobStorage();
    
    // Store initial job status
    await storage.saveJobStatus(jobId, {
      jobId,
      status: 'queued',
      message: 'Job queued for processing...',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log(`📋 Job ${jobId} queued successfully`);
    
    // Call background function to process the job
    try {
      console.log(`🔄 Triggering background function for job ${jobId}`);
      
      const backgroundResponse = await fetch(`${process.env.NETLIFY_SITE_URL || 'https://jonathoncarter.com'}/.netlify/functions/content-generate-background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          request: body,
          options
        })
      });
      
      if (!backgroundResponse.ok) {
        console.error(`❌ Background function call failed: ${backgroundResponse.status} ${backgroundResponse.statusText}`);
        throw new Error(`Background function call failed: ${backgroundResponse.status} ${backgroundResponse.statusText}`);
      }
      
      console.log(`✅ Background function triggered successfully for job ${jobId}`);
      
      // Return immediately with job ID for monitoring
      return NextResponse.json({
        success: true,
        jobId,
        status: 'queued',
        message: 'Job queued for background processing',
        workflowType: 'enhanced-background',
        options: options
      }, { status: 202 }); // 202 Accepted - request accepted for processing
      
    } catch (error) {
      console.error(`❌ Failed to trigger background function for job ${jobId}:`, error);
      
      // Update job status to failed
      await storage.saveJobStatus(jobId, {
        jobId,
        status: 'failed',
        message: 'Failed to start background processing',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to start background processing',
        workflowType: 'enhanced-background-failed',
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
    const jobId = searchParams.get('workflowId') || searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId or workflowId parameter' },
        { status: 400 }
      );
    }

    console.log(`📊 Status check for job: ${jobId}`);

    // Use job storage to get status (handles both job_* and enhanced-workflow-* formats)
    const { getJobStorage } = await import('@/lib/storage/job-storage');
    const storage = getJobStorage();
    
    try {
      const jobData = await storage.getJobStatus(jobId);
      
      if (jobData) {
        console.log(`📊 Job status found: ${jobData.status}, progress: ${jobData.progress || 0}%`);
        return NextResponse.json({
          success: true,
          ...jobData,
          workflowType: 'enhanced-background'
        });
      }
    } catch (error) {
      console.error('Failed to load job status:', error);
    }

    // If job not found, check if it's a recent job that might still be initializing
    const timestampMatch = jobId.match(/(\d+)/);
    if (timestampMatch) {
      const jobTime = parseInt(timestampMatch[1]);
      const now = Date.now();
      const ageInMinutes = (now - jobTime) / (1000 * 60);
      
      // If the job is recent (less than 2 hours), it was likely a real failure
      if (ageInMinutes < 120) {
        console.log(`❌ Job ${jobId} not found and is recent (${Math.round(ageInMinutes)} min old) - likely failed`);
        return NextResponse.json({
          jobId,
          status: 'failed', 
          progress: 0,
          error: 'Job failed - could not be found in storage',
          workflowType: 'enhanced-background-failed',
          createdAt: new Date(jobTime).toISOString(),
          updatedAt: new Date().toISOString(),
          message: 'Job processing failed'
        });
      }
      
      // If job is very recent (less than 30 seconds), assume it's still initializing
      if (ageInMinutes < 0.5) {
        console.log(`⏳ Job ${jobId} is initializing...`);
        return NextResponse.json({
          jobId,
          status: 'queued',
          progress: 0,
          message: 'Job is initializing...',
          workflowType: 'enhanced-background',
          createdAt: new Date(jobTime).toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    console.log(`❌ Job ${jobId} not found`);
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}