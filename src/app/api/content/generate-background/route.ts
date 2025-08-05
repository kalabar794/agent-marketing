import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationRequest } from '@/types/content';
import { getJobStorage } from '@/lib/storage/job-storage';

// Initialize job storage (handles both Netlify Blobs and fallback)
const storage = getJobStorage();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ContentGenerationRequest & { enableFallbacks?: boolean };
    
    console.log('🚀 Background API Route - Starting job submission:', {
      productType: body.productType,
      targetAudience: body.targetAudience,
      contentGoals: body.contentGoals?.length || 0
    });

    // Generate unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store initial job status in Netlify Blobs
    const jobData = {
      jobId,
      status: 'queued',
      message: 'Job queued for background processing',
      progress: 0,
      createdAt: new Date().toISOString(),
      request: body
    };
    
    await storage.saveJobStatus(jobId, jobData);
    console.log(`[Background API] Job ${jobId} queued`);

    // Call Netlify Background Function
    try {
      const backgroundFunctionUrl = process.env.NODE_ENV === 'production' 
        ? `${request.nextUrl.origin}/.netlify/functions/content-generate-background`
        : 'http://localhost:8888/.netlify/functions/content-generate-background';

      console.log(`[Background API] Calling background function at: ${backgroundFunctionUrl}`);

      // Trigger background function with improved error handling
      const backgroundPromise = fetch(backgroundFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          request: {
            ...body,
            enableFallbacks: false // CRITICAL: User directive - no fallback content ever
          }
        }),
        // Add timeout to prevent hanging - increased for background function initialization
        signal: AbortSignal.timeout(30000) // 30 second timeout for the initial call
      });

      // Handle the background function response
      backgroundPromise
        .then(async (response) => {
          console.log(`[Background API] Background function responded with status: ${response.status}`);
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error(`[Background API] Background function failed: ${errorText}`);
            await storage.updateJobStatus(jobId, {
              status: 'failed',
              message: `Background function failed: ${errorText}`,
              error: errorText
            });
          } else {
            console.log(`[Background API] Background function started successfully for job ${jobId}`);
          }
        })
        .catch(async (error) => {
          console.error(`[Background API] Failed to trigger background function:`, error);
          // Update job status to failed
          await storage.updateJobStatus(jobId, {
            status: 'failed',
            message: `Failed to start background processing: ${error.message}`,
            error: error.message
          });
        });

    } catch (error) {
      console.error('[Background API] Error triggering background function:', error);
      await storage.updateJobStatus(jobId, {
        status: 'failed',
        message: `Failed to start background processing: ${error.message}`,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Return job ID immediately
    return NextResponse.json({
      success: true,
      jobId,
      message: 'Job submitted for background processing',
      statusUrl: `/api/content/status/${jobId}`
    });

  } catch (error) {
    console.error('❌ Background API Route Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to submit job for background processing'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Helper function to get job status (used by status API)
export async function getJobStatus(jobId: string) {
  return await storage.getJobStatus(jobId);
}

// Helper function to update job status (used by background function)
export async function updateJobStatus(jobId: string, updates: any) {
  await storage.updateJobStatus(jobId, updates);
}