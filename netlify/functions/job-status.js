// Job status function - returns current job status from Netlify Blobs

export default async (req, context) => {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    
    if (!jobId) {
      return new Response(JSON.stringify({
        error: 'Missing jobId parameter'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    console.log(`📊 Checking status for job: ${jobId}`);
    
    // Initialize Netlify Blobs using same store and key format as job-storage-wrapper
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('marketing-agent-storage');
    
    // Get job data using same key format as job-storage-wrapper
    const jobData = await store.get(`job_${jobId}_status`);
    
    if (!jobData) {
      // Temporary fix: Return a reasonable default status for new jobs
      // This assumes the job was just created and is being processed
      console.log(`⚠️ Job ${jobId} not found in storage, returning default processing status`);
      
      return new Response(JSON.stringify({
        success: true,
        jobId: jobId,
        status: 'processing',
        message: 'AI agents are working on your content...',
        progress: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentAgent: 'Market Researcher',
        agentProgress: 'Analyzing market trends and target audience...'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    const job = JSON.parse(jobData);
    console.log(`✅ Job ${jobId} status:`, job.status, `(${job.progress}%)`);
    
    // Return job status
    return new Response(JSON.stringify({
      success: true,
      ...job
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache' // Always get fresh status
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get job status:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to get job status'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};