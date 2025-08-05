// Test if agents can actually make API calls to Claude
const { ContentWriter } = require('../../src/lib/agents/content-writer.ts');

exports.handler = async (event, context) => {
  console.log('🧪 DEBUG: Testing agent API call...');
  
  try {
    // Create a simple test request
    const testRequest = {
      topic: 'Test Topic',
      audience: 'developers',
      contentType: 'blog post',
      goals: 'test API connectivity',
      tone: 'professional'
    };
    
    // Create content writer instance
    const writer = new ContentWriter();
    console.log('✅ ContentWriter instantiated successfully');
    
    // Test the health check method first
    console.log('🏥 Running health check...');
    const healthResult = await writer.healthCheck();
    console.log('🏥 Health check result:', healthResult);
    
    if (!healthResult) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          stage: 'health_check_failed',
          message: 'Agent health check failed - API key or connection issue',
          timestamp: new Date().toISOString()
        })
      };
    }
    
    // If health check passes, try a simple content generation
    console.log('📝 Attempting simple content generation...');
    const result = await writer.execute(testRequest, { previousOutputs: {} });
    console.log('📝 Content generation completed successfully');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        healthCheck: healthResult,
        contentGenerated: !!result,
        wordCount: result?.metadata?.wordCount || 0,
        title: result?.content?.title || 'No title',
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('❌ AGENT CALL DEBUG FAILED:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  }
};