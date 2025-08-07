// Job creation function - creates job and triggers background processing

export default async (req, context) => {
  console.log('🚀 Job Creation Function Started');
  
  try {
    const request = await req.json();
    
    // Generate unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Creating job ${jobId}:`, {
      productType: request.productType,
      topic: request.topic,
      targetAudience: request.targetAudience
    });

    // Initialize Netlify Blobs
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('marketing-jobs');
    
    // Create initial job record
    const jobData = {
      jobId,
      status: 'queued',
      message: 'Job queued for background processing',
      progress: 0,
      request: request,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store job in Netlify Blobs
    await store.set(`job:${jobId}`, JSON.stringify(jobData));
    console.log(`✅ Job ${jobId} stored in queue`);
    
    // Trigger background processing
    const backgroundUrl = `${context.site.url}/.netlify/functions/process-job-background`;
    console.log(`🔄 Triggering background processing at: ${backgroundUrl}`);
    
    // Fire and forget - trigger background function
    // Use native fetch (available in Node 18+)
    try {
      const triggerResponse = await fetch(backgroundUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          request
        })
      });
      
      if (!triggerResponse.ok) {
        console.error(`Background function returned ${triggerResponse.status}`);
        // Don't update job status - let it retry
      } else {
        console.log(`✅ Background function triggered successfully for ${jobId}`);
      }
    } catch (error) {
      console.error(`Failed to trigger background processing for ${jobId}:`, error);
      // Don't mark as failed - the job can still be picked up
      console.log('Job remains in queue for manual processing');
    }
    
    // Return job ID immediately
    return new Response(JSON.stringify({
      success: true,
      jobId,
      message: 'Job created and queued for processing',
      statusUrl: `${context.site.url}/.netlify/functions/job-status?jobId=${jobId}`
    }), {
      status: 202, // Accepted - processing will happen asynchronously
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ Job creation failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to create job'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};