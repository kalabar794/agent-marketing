// Simple test function to verify basic functionality
exports.handler = async (event, context) => {
  console.log('🚀 Test function started');
  
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const jobId = body.jobId || 'test-job';
    
    console.log('✅ Test function processing job:', jobId);
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Test function completed for job:', jobId);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        jobId,
        message: 'Test function completed successfully',
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('❌ Test function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};