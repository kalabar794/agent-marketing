const { getStore } = require('@netlify/blobs');

// Create simple job creation function
exports.handler = async (event, context) => {
  console.log('🚀 Create-job function started');
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    const body = JSON.parse(event.body);
    console.log('📝 Creating job with request:', {
      productType: body.productType,
      targetAudience: body.targetAudience,
      contentGoals: body.contentGoals?.length || 0
    });

    // Generate job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 Generated job ID:', jobId);

    // Initialize unified job storage (same as background + status)
    let usingBlobs = false;
    let jobStorageWrapper = null;
    try {
      jobStorageWrapper = require('./job-storage-wrapper.js');
      usingBlobs = true; // wrapper itself decides blobs vs file vs memory
      console.log('✅ Using unified job-storage-wrapper');
    } catch (error) {
      console.warn('⚠️ Failed to load job-storage-wrapper, initial status may not persist:', error.message);
    }

    // Create initial job status
    const initialJobStatus = {
      jobId,
      status: 'queued',
      message: 'Job queued for processing...',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      request: body
    };

    // Save initial status using the same mechanism used by other functions
    if (jobStorageWrapper) {
      try {
        const { getJobStorage } = jobStorageWrapper;
        const storage = getJobStorage();
        await storage.saveJobStatus(jobId, initialJobStatus);
        console.log('💾 Initial job status saved via job-storage-wrapper');
      } catch (error) {
        console.warn('⚠️ Failed to save initial status via wrapper:', error.message);
      }
    }

    // Delegate to the content generation function
    console.log('🔄 Delegating to content-generate-background function');
    
    try {
      const generateUrl = process.env.NODE_ENV === 'production'
        ? `https://${process.env.NETLIFY_SITE_URL || event.headers.host}/.netlify/functions/content-generate-background`
        : 'http://localhost:8888/.netlify/functions/content-generate-background';

      console.log('📞 Calling content generation at:', generateUrl);

      // Call the content generation function asynchronously (with manual timeout)
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      const generateResponse = await fetch(generateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          request: body,
          options: {
            priorityMode: body.priorityMode || 'balanced',
            maxExecutionTime: body.maxExecutionTime || 900,
            enableOptimization: body.enableOptimization !== false,
            maxOptimizationCycles: body.maxOptimizationCycles || 2,
            enableFallbacks: body.enableFallbacks !== false
          }
        }),
        signal: controller.signal
      });
      clearTimeout(t);

      if (generateResponse.ok) {
        console.log('✅ Content generation function called successfully');
      } else {
        console.warn('⚠️ Content generation function call failed, job will still be created');
      }
    } catch (error) {
      console.warn('⚠️ Failed to call content generation function:', error.message);
      // Don't fail the entire job creation if the delegation fails
    }

    // Return successful job creation response
    const response = {
      success: true,
      jobId,
      status: 'queued',
      message: 'Job created and queued for processing',
      statusUrl: `/.netlify/functions/job-status?jobId=${jobId}`,
      createdAt: initialJobStatus.createdAt,
      usingBlobs
    };

    console.log('✅ Job creation completed:', response);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('❌ Create-job function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Job creation failed',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};