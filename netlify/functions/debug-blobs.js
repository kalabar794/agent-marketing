// Debug function to test Netlify Blobs connectivity

export default async (req, context) => {
  console.log('🔍 Testing Netlify Blobs connectivity...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NETLIFY_SITE_ID: process.env.NETLIFY_SITE_ID ? '✅ Set' : '❌ Missing',
      NETLIFY_API_TOKEN: process.env.NETLIFY_API_TOKEN ? '✅ Set' : '❌ Missing',
      NETLIFY_AUTH_TOKEN: process.env.NETLIFY_AUTH_TOKEN ? '✅ Set' : '❌ Missing',
    },
    tests: {}
  };
  
  try {
    // Test 1: Import @netlify/blobs
    console.log('Test 1: Importing @netlify/blobs...');
    const { getStore } = await import('@netlify/blobs');
    results.tests.import = { success: true, message: '@netlify/blobs imported successfully' };
    
    // Test 2: Initialize store with automatic config
    console.log('Test 2: Initializing store with automatic config...');
    try {
      const autoStore = getStore('debug-test');
      results.tests.autoInit = { success: true, message: 'Auto-initialization successful' };
      
      // Test 3: Write test data
      console.log('Test 3: Writing test data...');
      const testKey = `test-${Date.now()}`;
      const testValue = { message: 'Hello from Netlify Blobs!', timestamp: new Date().toISOString() };
      
      await autoStore.set(testKey, JSON.stringify(testValue));
      results.tests.write = { success: true, message: 'Write operation successful', key: testKey };
      
      // Test 4: Read test data
      console.log('Test 4: Reading test data...');
      const readValue = await autoStore.get(testKey);
      if (readValue) {
        const parsed = JSON.parse(readValue);
        results.tests.read = { success: true, message: 'Read operation successful', data: parsed };
      } else {
        results.tests.read = { success: false, message: 'Read returned null' };
      }
      
      // Test 5: Delete test data
      console.log('Test 5: Cleaning up test data...');
      await autoStore.delete(testKey);
      results.tests.cleanup = { success: true, message: 'Cleanup successful' };
      
    } catch (autoError) {
      console.log('Auto-initialization failed, trying manual config...');
      results.tests.autoInit = { success: false, message: autoError.message };
      
      // Test 2b: Manual initialization
      try {
        const manualStore = getStore('debug-test', {
          siteID: process.env.NETLIFY_SITE_ID,
          token: process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN,
        });
        
        results.tests.manualInit = { success: true, message: 'Manual initialization successful' };
        
        // Repeat tests with manual store
        const testKey = `manual-test-${Date.now()}`;
        const testValue = { message: 'Hello from manual Netlify Blobs!', timestamp: new Date().toISOString() };
        
        await manualStore.set(testKey, JSON.stringify(testValue));
        results.tests.manualWrite = { success: true, message: 'Manual write successful' };
        
        const readValue = await manualStore.get(testKey);
        if (readValue) {
          results.tests.manualRead = { success: true, message: 'Manual read successful', data: JSON.parse(readValue) };
        }
        
        await manualStore.delete(testKey);
        results.tests.manualCleanup = { success: true, message: 'Manual cleanup successful' };
        
      } catch (manualError) {
        results.tests.manualInit = { success: false, message: manualError.message };
      }
    }
    
  } catch (importError) {
    results.tests.import = { success: false, message: importError.message };
  }
  
  // Calculate overall success
  const testResults = Object.values(results.tests);
  const successCount = testResults.filter(t => t.success).length;
  const totalTests = testResults.length;
  
  results.summary = {
    success: successCount > 0,
    passed: successCount,
    total: totalTests,
    message: successCount === totalTests 
      ? '✅ All Netlify Blobs tests passed'
      : successCount > 0
      ? `⚠️ ${successCount}/${totalTests} tests passed`
      : '❌ All Netlify Blobs tests failed'
  };
  
  console.log('🔍 Blobs connectivity test results:', results.summary);
  
  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};