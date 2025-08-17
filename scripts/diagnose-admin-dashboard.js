#!/usr/bin/env node

/**
 * Diagnostic script for Admin Dashboard "Something went wrong" error
 * This script tests each component that could cause the dashboard to fail
 */

const { PrismaClient } = require('@prisma/client');
const { kv } = require('@vercel/kv');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const prisma = new PrismaClient();
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test simple query
    const count = await prisma.indexitem.count();
    console.log(`✅ Database query successful: ${count} items found`);
    
    // Test specific queries used in dashboard
    const campuses = ['Cañada College', 'College of San Mateo', 'Skyline College', 'District Office'];
    console.log('🔍 Testing campus queries...');
    
    for (const campus of campuses) {
      const campusCount = await prisma.indexitem.count({ where: { campus } });
      console.log(`  ${campus}: ${campusCount} items`);
    }
    
    // Test recent items query
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await prisma.indexitem.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    });
    console.log(`✅ Recent items query successful: ${recentCount} recent items`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Database test failed:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    return false;
  }
  
  return true;
}

async function testKVStore() {
  console.log('\n🔍 Testing KV store connection...');
  
  try {
    // Test basic KV operations
    const testKey = 'diagnostic-test-' + Date.now();
    const testValue = { test: true, timestamp: new Date().toISOString() };
    
    // Test set
    await kv.set(testKey, testValue, { ex: 10 }); // 10 second expiry
    console.log('✅ KV set operation successful');
    
    // Test get
    const retrieved = await kv.get(testKey);
    console.log('✅ KV get operation successful:', retrieved);
    
    // Test cache stats keys (used by dashboard)
    const cacheKeys = await kv.keys('cache:stats:*');
    console.log(`✅ Cache stats keys found: ${cacheKeys.length}`);
    
    // Test performance metrics keys
    const performanceKeys = await kv.keys('metrics:*');
    console.log(`✅ Performance metrics keys found: ${performanceKeys.length}`);
    
    // Clean up
    await kv.del(testKey);
    console.log('✅ KV cleanup successful');
    
  } catch (error) {
    console.error('❌ KV store test failed:', {
      message: error.message,
      stack: error.stack
    });
    return false;
  }
  
  return true;
}

async function testEnvironmentVariables() {
  console.log('\n🔍 Checking environment variables...');
  
  const requiredVars = [
    'DATABASE_URL',
    'KV_REST_API_TOKEN',
    'KV_REST_API_URL',
    'NODE_ENV'
  ];
  
  const missing = [];
  const present = [];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      present.push(varName);
      // Don't log actual values for security
      console.log(`✅ ${varName}: configured`);
    } else {
      missing.push(varName);
      console.log(`❌ ${varName}: missing`);
    }
  }
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  console.log(`✅ All required environment variables present`);
  return true;
}

async function testCacheStatsFunction() {
  console.log('\n🔍 Testing cache stats function...');
  
  try {
    // Simulate the getCacheStats function from indexItems-cached.ts
    const allKeys = await kv.keys('indexItems:*');
    console.log(`✅ Found ${allKeys.length} cache keys`);
    
    // Get hit/miss stats
    const dateKey = new Date().toISOString().split('T')[0];
    const hits = await kv.hget('cache:stats:hits', dateKey) || 0;
    const misses = await kv.hget('cache:stats:misses', dateKey) || 0;
    
    const totalHits = Number(hits);
    const totalMisses = Number(misses);
    const totalRequests = totalHits + totalMisses;
    
    const stats = {
      totalKeys: allKeys.length,
      totalRequests,
      cachedRequests: totalHits,
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
    };
    
    console.log('✅ Cache stats calculation successful:', stats);
    
  } catch (error) {
    console.error('❌ Cache stats test failed:', {
      message: error.message,
      stack: error.stack
    });
    return false;
  }
  
  return true;
}

async function runDiagnostics() {
  console.log('🚀 Starting Admin Dashboard Diagnostics\n');
  
  const results = {
    environment: await testEnvironmentVariables(),
    database: await testDatabaseConnection(),
    kvStore: await testKVStore(),
    cacheStats: await testCacheStatsFunction()
  };
  
  console.log('\n📊 Diagnostic Results:');
  console.log('========================');
  
  for (const [test, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  }
  
  const allPassed = Object.values(results).every(Boolean);
  
  if (allPassed) {
    console.log('\n🎉 All diagnostics passed! The admin dashboard should work correctly.');
    console.log('If you are still seeing "Something went wrong", check:');
    console.log('  1. Browser console for client-side errors');
    console.log('  2. Server logs for runtime errors');
    console.log('  3. Network connectivity');
  } else {
    console.log('\n❌ Some diagnostics failed. Fix the issues above to resolve the dashboard error.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('💥 Diagnostic script crashed:', error);
  process.exit(1);
});