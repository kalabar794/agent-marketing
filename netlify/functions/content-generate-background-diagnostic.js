// Diagnostic version of background function to identify the root cause
exports.handler = async (event, context) => {
  console.log('🔍 DIAGNOSTIC: Background Function Started:', {
    method: event.httpMethod,
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      ANTHROPIC_API_KEY_SET: !!process.env.ANTHROPIC_API_KEY,
      NETLIFY_SITE_ID: process.env.NETLIFY_SITE_ID,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
    }
  });

  // Step 1: Parse request
  let jobId, request;
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    jobId = body.jobId;
    request = body.request;
    
    console.log('✅ DIAGNOSTIC Step 1: Request parsed:', {
      hasJobId: !!jobId,
      hasRequest: !!request,
      requestKeys: request ? Object.keys(request) : []
    });
  } catch (error) {
    console.error('❌ DIAGNOSTIC Step 1 FAILED: Request parsing failed:', error);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: `Request parsing failed: ${error.message}`,
        stage: 'request_parsing'
      })
    };
  }

  // Step 2: Update job status to processing
  try {
    console.log('🔄 DIAGNOSTIC Step 2: Updating job status to processing...');
    await updateJobStatus(jobId, 'processing', 'Starting diagnostic workflow...', 5);
    console.log('✅ DIAGNOSTIC Step 2: Job status updated to processing');
  } catch (error) {
    console.error('❌ DIAGNOSTIC Step 2 FAILED: Status update failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: `Status update failed: ${error.message}`,
        stage: 'status_update'
      })
    };
  }

  // Step 3: Test imports one by one
  const importTests = [
    { name: 'job-storage', path: '../../src/lib/storage/job-storage.ts' },
    { name: 'enhanced-workflow-background', path: '../../src/lib/enhanced-workflow-background.ts' },
    { name: 'enhanced-orchestrator', path: '../../src/lib/agents/enhanced-orchestrator.ts' },
    { name: 'evaluator-optimizer', path: '../../src/lib/quality/evaluator-optimizer.ts' }
  ];

  const importResults = {};
  
  for (const test of importTests) {
    try {
      console.log(`🔄 DIAGNOSTIC Step 3.${test.name}: Testing import ${test.path}...`);
      const module = await import(test.path);
      importResults[test.name] = {
        success: true,
        exports: Object.keys(module)
      };
      console.log(`✅ DIAGNOSTIC Step 3.${test.name}: Import successful, exports:`, Object.keys(module));
      await updateJobStatus(jobId, 'processing', `Import ${test.name} successful`, 10 + importTests.indexOf(test) * 10);
    } catch (error) {
      console.error(`❌ DIAGNOSTIC Step 3.${test.name} FAILED:`, error);
      importResults[test.name] = {
        success: false,
        error: error.message,
        stack: error.stack
      };
      await updateJobStatus(jobId, 'failed', `Import ${test.name} failed: ${error.message}`, 0, null, error.message);
      
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `Import ${test.name} failed: ${error.message}`,
          stage: 'import_testing',
          importResults,
          stack: error.stack
        })
      };
    }
  }

  // Step 4: Test workflow initialization
  try {
    console.log('🔄 DIAGNOSTIC Step 4: Testing workflow initialization...');
    const { EnhancedWorkflow } = await import('../../src/lib/enhanced-workflow-background.ts');
    const workflow = new EnhancedWorkflow();
    
    console.log('✅ DIAGNOSTIC Step 4: Workflow initialized successfully');
    await updateJobStatus(jobId, 'processing', 'Workflow initialization successful', 60);
    
    // Step 5: Test a simple workflow execution
    console.log('🔄 DIAGNOSTIC Step 5: Testing simple workflow execution...');
    
    // Create a minimal test request
    const testRequest = {
      productType: 'Test Product',
      targetAudience: 'Test Audience',
      contentGoals: ['test'],
      topic: 'Diagnostic Test',
      contentType: 'blog'
    };

    const result = await workflow.generateContent(testRequest, (agentId, progress, message) => {
      console.log(`🔄 DIAGNOSTIC Progress: ${agentId} - ${progress}% - ${message}`);
    });

    console.log('✅ DIAGNOSTIC Step 5: Workflow execution completed:', {
      hasResult: !!result,
      resultKeys: result ? Object.keys(result) : []
    });

    await updateJobStatus(jobId, 'completed', 'Diagnostic completed successfully!', 100, {
      diagnostic: true,
      importResults,
      workflowResult: result,
      message: 'All systems working correctly'
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        jobId,
        message: 'Diagnostic completed successfully - background processing is working',
        importResults,
        workflowCompleted: true
      })
    };

  } catch (error) {
    console.error('❌ DIAGNOSTIC Step 4/5 FAILED: Workflow failed:', error);
    await updateJobStatus(jobId, 'failed', `Workflow failed: ${error.message}`, 0, null, error.message);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: `Workflow failed: ${error.message}`,
        stage: 'workflow_execution',
        importResults,
        stack: error.stack
      })
    };
  }
};

// Helper function to update job status
async function updateJobStatus(jobId, status, message, progress = 0, result = null, error = null) {
  const statusData = {
    jobId,
    status,
    message,
    progress,
    result,
    error,
    updatedAt: new Date().toISOString()
  };

  console.log(`[Diagnostic Status Update] Job ${jobId}:`, statusData);
  
  try {
    const { getJobStorage } = await import('../../src/lib/storage/job-storage.ts');
    const storage = getJobStorage();
    await storage.saveJobStatus(jobId, statusData);
  } catch (error) {
    console.error(`Failed to save job status for ${jobId}:`, error);
  }
}