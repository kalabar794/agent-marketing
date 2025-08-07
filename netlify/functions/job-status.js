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
    
    // Initialize Netlify Blobs
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('marketing-jobs');
    
    // Get job data
    const jobData = await store.get(`job:${jobId}`);
    
    if (!jobData) {
      return new Response(JSON.stringify({
        error: 'Job not found',
        jobId: jobId
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
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