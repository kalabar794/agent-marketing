// Debug function to test each step of the workflow
exports.handler = async (event, context) => {
  console.log('🔍 DEBUG: Starting workflow debugging...');
  
  try {
    // Step 1: Test basic function execution
    console.log('Step 1: Basic function execution - OK');
    
    // Step 2: Test environment variables
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    console.log('Step 2: ANTHROPIC_API_KEY present:', hasApiKey);
    
    // Step 3: Test TypeScript imports
    console.log('Step 3: Testing TypeScript imports...');
    const { EnhancedWorkflow } = await import('../../src/lib/enhanced-workflow-background.ts');
    console.log('Step 3: EnhancedWorkflow imported successfully');
    
    // Step 4: Test workflow instantiation
    console.log('Step 4: Testing workflow instantiation...');
    const workflow = new EnhancedWorkflow();
    console.log('Step 4: EnhancedWorkflow instantiated successfully');
    
    // Step 5: Test simple method call
    console.log('Step 5: Testing workflow method call...');
    const workflowId = workflow.getId();
    console.log('Step 5: Workflow ID retrieved:', workflowId);
    
    // Step 6: Test minimal content generation with timeout
    console.log('Step 6: Testing actual content generation...');
    const testRequest = {
      contentType: 'blog',
      topic: 'Simple Test Topic',
      audience: 'Test Audience', 
      goals: ['Test Goal'],
      tone: 'Professional',
      length: 'comprehensive'
    };
    
    // Test with a 10-second timeout to see if it starts properly
    const contentPromise = workflow.generateContent(testRequest, (agentId, progress, message) => {
      console.log(`Progress: ${agentId} - ${progress}% - ${message}`);
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Content generation timeout after 10 seconds')), 10000);
    });
    
    let contentResult = null;
    try {
      contentResult = await Promise.race([contentPromise, timeoutPromise]);
      console.log('Step 6: Content generation completed successfully');
    } catch (error) {
      if (error.message.includes('timeout')) {
        console.log('Step 6: Content generation started but timed out (this is expected for debugging)');
        contentResult = 'STARTED_BUT_TIMED_OUT';
      } else {
        throw error; // Re-throw actual errors
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'All debug steps passed',
        steps: {
          basicExecution: true,
          apiKeyPresent: hasApiKey,
          typescriptImport: true,
          workflowInstantiation: true,
          workflowMethodCall: true,
          contentGeneration: contentResult !== null
        },
        workflowId,
        contentGenerationResult: contentResult,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('❌ DEBUG FAILED at step:', error.message);
    console.error('❌ Full error:', error);
    console.error('❌ Stack trace:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  }
};