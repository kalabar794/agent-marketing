import { NextRequest, NextResponse } from 'next/server';
import { getJobStorage } from '@/lib/storage/job-storage';

// Initialize job storage (handles both Netlify Blobs and fallback)
const storage = getJobStorage();

// Server-Sent Events for real-time updates
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  
  // Check if this is a Server-Sent Events request
  const acceptHeader = request.headers.get('accept');
  const isSSE = acceptHeader?.includes('text/event-stream');

  if (isSSE) {
    // Server-Sent Events stream
    console.log(`[SSE] Starting stream for job ${jobId}`);
    
    const encoder = new TextEncoder();
    let isStreamClosed = false;

    const stream = new ReadableStream({
      start(controller) {
        const sendEvent = (data: any) => {
          if (isStreamClosed) return;
          
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Send initial status
        const initializeStatus = async () => {
          try {
            const jobData = await storage.getJobStatus(jobId);
            if (jobData) {
              sendEvent(jobData);
            } else {
              sendEvent({
                jobId,
                status: 'not_found',
                message: 'Job not found',
                progress: 0
              });
            }
          } catch (error) {
            console.error(`Error getting initial job status for ${jobId}:`, error);
            sendEvent({
              jobId,
              status: 'error',
              message: 'Error fetching job status',
              progress: 0
            });
          }
        };
        
        initializeStatus();

        // Poll for updates every 2 seconds
        const pollInterval = setInterval(async () => {
          if (isStreamClosed) {
            clearInterval(pollInterval);
            return;
          }

          try {
            const currentJobData = await storage.getJobStatus(jobId);
            if (currentJobData) {
              sendEvent(currentJobData);
              
              // Close stream if job is completed or failed
              if (currentJobData.status === 'completed' || currentJobData.status === 'failed') {
                clearInterval(pollInterval);
                isStreamClosed = true;
                controller.close();
              }
            }
          } catch (error) {
            console.error(`Error polling job status for ${jobId}:`, error);
          }
        }, 2000);

        // Cleanup on stream close
        return () => {
          isStreamClosed = true;
          clearInterval(pollInterval);
        };
      },
      cancel() {
        isStreamClosed = true;
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } else {
    // Regular status check
    try {
      const jobData = await storage.getJobStatus(jobId);
      
      if (!jobData) {
        return NextResponse.json({
          success: false,
          error: 'Job not found',
          jobId
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        ...jobData
      });
    } catch (error) {
      console.error(`Error getting job status for ${jobId}:`, error);
      return NextResponse.json({
        success: false,
        error: 'Error fetching job status',
        jobId
      }, { status: 500 });
    }
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}

// Helper function to update job status from background function
export async function updateJobStatus(jobId: string, updates: any) {
  try {
    await storage.updateJobStatus(jobId, updates);
    console.log(`[Status API] Updated job ${jobId}:`, updates);
  } catch (error) {
    console.error(`[Status API] Failed to update job ${jobId}:`, error);
  }
}