import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationRequest } from '@/types/content';
import { getJobStorage } from '@/lib/storage/job-storage';

// Initialize job storage (handles both Netlify Blobs and fallback)
const storage = getJobStorage();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ContentGenerationRequest & { enableFallbacks?: boolean };
    
    console.log('🚀 Background API Route - Delegating to new Netlify Functions architecture:', {
      productType: body.productType,
      targetAudience: body.targetAudience,
      contentGoals: body.contentGoals?.length || 0
    });

    // Use the new Netlify Functions architecture
    const createJobUrl = process.env.NODE_ENV === 'production' 
      ? `${request.nextUrl.origin}/.netlify/functions/create-job`
      : 'http://localhost:8888/.netlify/functions/create-job';

    console.log(`[Background API] Calling create-job function at: ${createJobUrl}`);

    // Call the create-job Netlify Function
    const response = await fetch(createJobUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        enableFallbacks: false // CRITICAL: User directive - no fallback content ever
      }),
      // Timeout for job creation (should be fast)
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Background API] Create-job function failed:`, errorText);
      throw new Error(`Job creation failed: ${errorText}`);
    }

    const result = await response.json();
    console.log(`[Background API] Job created successfully:`, result.jobId);

    // Return the result from the create-job function
    // Update the statusUrl to use our Next.js API for compatibility
    return NextResponse.json({
      ...result,
      statusUrl: `/api/content/status/${result.jobId}`
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