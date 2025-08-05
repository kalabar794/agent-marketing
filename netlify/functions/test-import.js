// Test function to check TypeScript imports
exports.handler = async (event, context) => {
  console.log('🧪 Testing TypeScript imports...');
  
  try {
    console.log('Step 1: Testing dynamic import...');
    const { EnhancedWorkflow } = await import('../../src/lib/enhanced-workflow-background.ts');
    console.log('✅ EnhancedWorkflow imported successfully');
    
    console.log('Step 2: Testing instantiation...');
    const workflow = new EnhancedWorkflow();
    console.log('✅ EnhancedWorkflow instantiated successfully');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'TypeScript imports working correctly',
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('❌ Import test failed:', error);
    console.error('❌ Error stack:', error.stack);
    
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