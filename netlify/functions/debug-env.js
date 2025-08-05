// Debug function to check environment variables
exports.handler = async (event, context) => {
  console.log('🔍 DEBUG: Checking environment variables...');
  
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const siteId = process.env.NETLIFY_SITE_ID;
    const nodeEnv = process.env.NODE_ENV;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        environment: {
          hasApiKey: !!apiKey,
          apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT_SET',
          apiKeyLength: apiKey ? apiKey.length : 0,
          hasSiteId: !!siteId,
          nodeEnv,
          allEnvKeys: Object.keys(process.env).filter(key => 
            key.includes('ANTHROPIC') || 
            key.includes('NETLIFY') || 
            key.includes('NODE')
          )
        },
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('❌ ENV DEBUG FAILED:', error);
    
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