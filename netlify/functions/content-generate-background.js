// Background function for multi-agent content generation

exports.handler = async (event, context) => {
  console.log('🚀 Background Function Started:', {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? JSON.parse(event.body) : null,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      ANTHROPIC_API_KEY_SET: !!process.env.ANTHROPIC_API_KEY,
      NETLIFY_SITE_ID: process.env.NETLIFY_SITE_ID
    }
  });

  // Set up global timeout wrapper - CRITICAL for preventing hanging
  const globalTimeout = new Promise((_, reject) => {
    setTimeout(() => {
      console.error('❌ GLOBAL TIMEOUT: Background function exceeded 12 minutes');
      reject(new Error('Background function exceeded maximum execution time (12 minutes)'));
    }, 12 * 60 * 1000); // 12 minutes for better reliability
  });

  // Wrap the entire execution in a race with the global timeout
  try {
    const result = await Promise.race([
      executeBackgroundFunction(event, context),
      globalTimeout
    ]);
    
    console.log('✅ Background function completed successfully within time limit');
    return result;

  } catch (error) {
    console.error('❌ Background function failed or timed out:', error);
    
    // Try to update job status if we have jobId
    const jobId = event.body ? JSON.parse(event.body).jobId : 'unknown';
    try {
      await updateJobStatus(jobId, 'failed', `Background function error: ${error.message}`, 0, null, error.message);
    } catch (statusError) {
      console.error('Failed to update job status on error:', statusError);
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        jobId
      })
    };
  }
};

// PERFORMANCE FIX: Add memory and performance monitoring
function logMemoryUsage(stage) {
  if (process.memoryUsage) {
    const usage = process.memoryUsage();
    console.log(`🔍 [Memory ${stage}]:`, {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`
    });
  }
}

// Extract main execution logic to separate function  
async function executeBackgroundFunction(event, context) {
  try {
    logMemoryUsage('START');
    
    console.log('📦 Step 1: Attempting to import EnhancedWorkflow...');
    // Dynamic import of the enhanced workflow (handles TypeScript)
    const { EnhancedWorkflow } = await import('../../src/lib/enhanced-workflow-background.ts');
    console.log('✅ Step 1: EnhancedWorkflow imported successfully');
    
    logMemoryUsage('AFTER_IMPORT');
    
    console.log('📦 Step 2: Parsing request body...');
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    
    if (!body.jobId || !body.request) {
      console.log('❌ Step 2: Missing jobId or request data');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing jobId or request data'
        })
      };
    }

    const { jobId, request } = body;
    console.log('✅ Step 2: Request body parsed successfully');
    
    console.log(`📦 Step 3: Processing job ${jobId}:`, {
      contentType: request.contentType,
      topic: request.topic,
      audience: request.audience,
      goals: request.goals?.length || 0
    });

    console.log('📦 Step 4: Attempting to create EnhancedWorkflow instance...');
    // Initialize the enhanced workflow with all 7 agents enabled
    const workflow = new EnhancedWorkflow();
    console.log('✅ Step 4: EnhancedWorkflow instance created successfully');
    
    logMemoryUsage('AFTER_WORKFLOW_INIT');
    
    console.log('📦 Step 5: Attempting to update job status to processing...');
    // Store job status as "processing"
    await updateJobStatus(jobId, 'processing', 'Starting multi-agent content generation...');
    console.log('✅ Step 5: Job status updated to processing');

    console.log('📦 Step 6: Setting up progress callback...');
    // Progress callback to update job status
    const progressCallback = async (agentId, progress, message) => {
      console.log(`[Background] Agent ${agentId}: ${progress}% - ${message || ''}`);
      await updateJobStatus(jobId, 'processing', `Agent ${agentId}: ${message || 'Processing...'}`, progress);
    };
    console.log('✅ Step 6: Progress callback configured');

    console.log('📦 Step 7: Starting workflow execution...');
    console.log('📦 Step 7a: Pre-execution timestamp:', new Date().toISOString());
    console.log('📦 Step 7b: Request details:', JSON.stringify(request, null, 2));
    
    // PERFORMANCE FIX: Add timeout wrapper around workflow execution - reduced to 10 minutes for better reliability
    const workflowPromise = workflow.generateContent(request, progressCallback);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Workflow execution timed out after 10 minutes')), 10 * 60 * 1000);
    });
    
    console.log('📦 Step 7c: Starting race between workflow and timeout...');
    
    let result;
    try {
      result = await Promise.race([workflowPromise, timeoutPromise]);
      console.log('✅ Step 7d: Workflow execution completed successfully at:', new Date().toISOString());
      console.log('✅ Step 7e: Result summary:', {
        hasTitle: !!result?.title,
        hasContent: !!result?.content,
        contentLength: result?.content?.length || 0,
        hasMetadata: !!result?.metadata
      });
      
      logMemoryUsage('AFTER_WORKFLOW_COMPLETION');
    } catch (workflowError) {
      console.error('❌ Step 7f: Workflow execution failed:', workflowError);
      console.error('❌ Step 7g: Workflow error stack:', workflowError.stack);
      throw new Error(`Workflow execution failed: ${workflowError.message}`);
    }
    
    console.log(`[Background] Job ${jobId} completed successfully`);
    
    // Store final result
    await updateJobStatus(jobId, 'completed', 'Content generation completed successfully!', 100, result);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        jobId,
        message: 'Background processing completed successfully'
      })
    };

  } catch (error) {
    console.error('❌ Background Function Error:', error);
    
    const jobId = event.body ? JSON.parse(event.body).jobId : 'unknown';
    
    // Store error status
    await updateJobStatus(jobId, 'failed', `Error: ${error.message}`, 0, null, error.message);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        jobId
      })
    };
  }
}

// Helper function to update job status using job storage
async function updateJobStatus(jobId, status, message, progress = 0, result = null, error = null) {
  const statusData = {
    jobId,
    status, // 'processing', 'completed', 'failed'
    message,
    progress,
    result,
    error,
    updatedAt: new Date().toISOString()
  };

  console.log(`[Status Update] Job ${jobId}:`, statusData);
  
  try {
    // Dynamic import of the job storage (handles both Netlify Blobs and fallback)
    const { getJobStorage } = await import('../../src/lib/storage/job-storage.ts');
    const storage = getJobStorage();
    await storage.saveJobStatus(jobId, statusData);
  } catch (error) {
    console.error(`Failed to save job status for ${jobId}:`, error);
  }
}