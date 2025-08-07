// Background function for multi-agent content generation
// Configure as Netlify Background Function
exports.config = {
  type: 'background'
};

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

  // Background functions in Netlify can run up to 15 minutes
  // They continue running even after returning a response
  try {
    // Return immediately to acknowledge receipt
    const body = event.body ? JSON.parse(event.body) : {};
    const jobId = body.jobId || 'unknown';
    
    console.log(`🚀 Background Function ${jobId} acknowledged, starting processing...`);
    
    // Execute the actual work
    executeBackgroundFunction(event, context)
      .then(() => {
        console.log(`✅ Background function ${jobId} completed successfully`);
      })
      .catch((error) => {
        console.error(`❌ Background function ${jobId} failed:`, error);
        updateJobStatus(jobId, 'failed', `Background processing error: ${error.message}`, 0, null, error.message);
      });
    
    // Return immediately with 202 Accepted
    return {
      statusCode: 202,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        jobId,
        message: 'Background processing started'
      })
    };
  } catch (error) {
    console.error('❌ Background function failed:', error);
    
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
    
    console.log('📦 Step 1: Importing Anthropic SDK directly...');
    const Anthropic = require('@anthropic-ai/sdk');
    console.log('✅ Step 1: Anthropic SDK imported successfully');
    
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

    console.log('📦 Step 4: Creating Anthropic client...');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    console.log('✅ Step 4: Anthropic client created successfully');
    
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

    console.log('📦 Step 7: Starting direct content generation...');
    console.log('📦 Step 7a: Pre-execution timestamp:', new Date().toISOString());
    console.log('📦 Step 7b: Request details:', {
      hasProductType: !!request.productType,
      hasTargetAudience: !!request.targetAudience,
      hasContentGoals: !!request.contentGoals,
      hasTopic: !!request.topic,
      hasTone: !!request.tone
    });
    
    // Simple direct approach - just generate content with Claude
    await progressCallback('content-writer', 25, 'Generating marketing content...');
    
    const prompt = `You are a professional marketing content writer. Create compelling marketing content based on these requirements:

Product Type: ${request.productType || 'Software'}
Target Audience: ${request.targetAudience || 'General audience'}  
Content Goals: ${request.contentGoals?.join(', ') || 'Brand awareness'}
Topic: ${request.topic || 'Product benefits'}
Tone: ${request.tone || 'Professional'}

Please create a comprehensive blog post that:
1. Has an engaging title
2. Addresses the target audience effectively
3. Achieves the specified content goals
4. Uses the appropriate tone
5. Is well-structured with clear sections
6. Includes actionable insights

Format the response as a complete blog post with title and content.`;

    await progressCallback('content-writer', 50, 'Calling Claude API...');
    console.log('🔔 Making Claude API call at:', new Date().toISOString());
    
    let result;
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      console.log('✅ Claude API responded at:', new Date().toISOString());
      await progressCallback('content-writer', 75, 'Processing response...');
      
      const content = message.content[0].text;
      
      // Extract title from content
      const lines = content.split('\n');
      let title = 'Generated Marketing Content';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          title = trimmed.replace(/^[#\s]*/, '').substring(0, 100);
          break;
        }
      }
      
      result = {
        title: title,
        content: content,
        metadata: {
          productType: request.productType,
          targetAudience: request.targetAudience,
          contentGoals: request.contentGoals,
          generatedAt: new Date().toISOString(),
          workflow: 'direct-claude-api'
        }
      };

      await progressCallback('workflow', 90, 'Content generation completed');
      console.log('🎯 Workflow completed at:', new Date().toISOString());
      
      console.log('✅ Step 7: Direct content generation completed successfully at:', new Date().toISOString());
      console.log('✅ Step 7 Result summary:', {
        hasTitle: !!result?.title,
        hasContent: !!result?.content,
        contentLength: result?.content?.length || 0,
        hasMetadata: !!result?.metadata
      });
      
    } catch (apiError) {
      console.error('❌ Step 7: Claude API call failed:', apiError);
      throw new Error(`Claude API call failed: ${apiError.message}`);
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

// Helper function to update job status using job storage with timeout
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

  console.log(`[Status Update] Job ${jobId}:`, {
    status,
    progress,
    message: message.substring(0, 100) // Log truncated message
  });
  
  try {
    // Use the simple JavaScript wrapper to avoid TypeScript import issues
    const { getJobStorage } = require('./job-storage-wrapper.js');
    const storage = getJobStorage();
    
    // Add timeout to storage operations to prevent I/O blocking
    const savePromise = storage.saveJobStatus(jobId, statusData);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Storage timeout after 5 seconds')), 5000)
    );
    
    await Promise.race([savePromise, timeoutPromise]);
  } catch (error) {
    console.error(`Failed to save job status for ${jobId}:`, error);
    // Don't throw - storage failures shouldn't stop the workflow
  }
}