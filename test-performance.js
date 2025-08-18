#!/usr/bin/env node

/**
 * Performance Testing Script
 * 
 * Tests the actual database query performance before and after optimizations
 */

const { performance } = require('perf_hooks');

// Test configuration
const PREVIEW_URL = 'https://site-index-git-develop-smcccd.vercel.app';
const ENDPOINTS_TO_TEST = [
  '/api/health',
  '/admin', // This should trigger dashboard queries
  '/api/admin/system/environment',
  '/api/admin/performance/real-metrics?type=api'
];

async function measureEndpoint(url, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📍 URL: ${url}`);
  
  const results = [];
  
  // Run 5 tests to get average
  for (let i = 1; i <= 5; i++) {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'performance-test-script',
          'Cache-Control': 'no-cache'
        }
      });
      
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      const responseTimeHeader = response.headers.get('x-response-time');
      const dbTimeHeader = response.headers.get('x-db-time');
      const cacheHeader = response.headers.get('x-cache');
      
      results.push({
        test: i,
        status: response.status,
        totalTime: duration,
        serverResponseTime: responseTimeHeader ? parseInt(responseTimeHeader) : null,
        dbTime: dbTimeHeader ? parseInt(dbTimeHeader) : null,
        cacheStatus: cacheHeader || 'N/A'
      });
      
      console.log(`  Test ${i}: ${duration}ms (Status: ${response.status}) ${cacheHeader ? `Cache: ${cacheHeader}` : ''}`);
      
    } catch (error) {
      console.log(`  Test ${i}: FAILED - ${error.message}`);
      results.push({
        test: i,
        error: error.message,
        totalTime: null
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Calculate statistics
  const successfulTests = results.filter(r => !r.error);
  if (successfulTests.length > 0) {
    const avgTime = Math.round(successfulTests.reduce((sum, r) => sum + r.totalTime, 0) / successfulTests.length);
    const minTime = Math.min(...successfulTests.map(r => r.totalTime));
    const maxTime = Math.max(...successfulTests.map(r => r.totalTime));
    
    console.log(`\n📊 Results Summary:`);
    console.log(`   Average: ${avgTime}ms`);
    console.log(`   Min: ${minTime}ms`);
    console.log(`   Max: ${maxTime}ms`);
    console.log(`   Success Rate: ${successfulTests.length}/5`);
    
    return {
      endpoint: url,
      description,
      avgTime,
      minTime,
      maxTime,
      successCount: successfulTests.length,
      results: successfulTests
    };
  } else {
    console.log(`❌ All tests failed`);
    return {
      endpoint: url,
      description,
      error: 'All tests failed',
      results
    };
  }
}

async function testDatabaseDirectly() {
  console.log(`\n🔍 Testing database queries directly (if possible)...`);
  
  try {
    // Test the health endpoint which should show db timing
    const healthUrl = `${PREVIEW_URL}/api/health`;
    const response = await fetch(healthUrl);
    const healthData = await response.json();
    
    if (healthData.checks && healthData.checks.database) {
      const dbCheck = healthData.checks.database[0];
      console.log(`Database connectivity: ${dbCheck.status}`);
      console.log(`Record count: ${dbCheck.observedValue}`);
      console.log(`Database response: ${dbCheck.output}`);
    }
    
  } catch (error) {
    console.log(`Cannot test database directly: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 SMCCCD Site Index Performance Test');
  console.log('=====================================');
  console.log(`Target: ${PREVIEW_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  const allResults = [];
  
  // Test database connectivity first
  await testDatabaseDirectly();
  
  // Test each endpoint
  for (const endpoint of ENDPOINTS_TO_TEST) {
    const url = `${PREVIEW_URL}${endpoint}`;
    const description = endpoint.replace('/api/', '').replace('/', '');
    
    const result = await measureEndpoint(url, description);
    allResults.push(result);
  }
  
  // Final summary
  console.log('\n🎯 PERFORMANCE TEST SUMMARY');
  console.log('===========================');
  
  allResults.forEach(result => {
    if (!result.error) {
      const status = result.avgTime <= 100 ? '✅ GOOD' : 
                    result.avgTime <= 500 ? '⚠️  SLOW' : '❌ CRITICAL';
      console.log(`${status} ${result.description}: ${result.avgTime}ms avg`);
    } else {
      console.log(`❌ FAILED ${result.description}: ${result.error}`);
    }
  });
  
  // Check if the dashboard is now faster
  const dashboardResult = allResults.find(r => r.endpoint.includes('/admin'));
  if (dashboardResult && !dashboardResult.error) {
    console.log(`\n📈 Dashboard Performance Analysis:`);
    console.log(`   Current average: ${dashboardResult.avgTime}ms`);
    console.log(`   Target: <500ms for good UX`);
    console.log(`   Status: ${dashboardResult.avgTime <= 500 ? '✅ Meeting target' : '❌ Needs optimization'}`);
  }
  
  console.log(`\n⏰ Test completed at ${new Date().toISOString()}`);
}

main().catch(console.error);