#!/usr/bin/env node

/**
 * Database Performance Benchmark
 * 
 * Tests actual database query performance using the Neon database branch
 * This will prove whether our QueryCache optimizations actually work
 */

const { PrismaClient } = require('@prisma/client');
const { performance } = require('perf_hooks');

// Initialize Prisma with our Neon test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function measureQuery(description, queryFn, iterations = 3) {
  console.log(`\n🧪 Testing: ${description}`);
  const results = [];
  
  for (let i = 1; i <= iterations; i++) {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      results.push({
        iteration: i,
        duration,
        resultCount: Array.isArray(result) ? result.length : typeof result === 'number' ? result : 1
      });
      
      console.log(`  Run ${i}: ${duration}ms (${results[i-1].resultCount} results)`);
      
    } catch (error) {
      console.log(`  Run ${i}: ERROR - ${error.message}`);
      results.push({
        iteration: i,
        error: error.message,
        duration: null
      });
    }
    
    // Small delay between runs
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successfulRuns = results.filter(r => r.duration !== null);
  if (successfulRuns.length > 0) {
    const avgDuration = Math.round(successfulRuns.reduce((sum, r) => sum + r.duration, 0) / successfulRuns.length);
    const minDuration = Math.min(...successfulRuns.map(r => r.duration));
    const maxDuration = Math.max(...successfulRuns.map(r => r.duration));
    
    console.log(`📊 Average: ${avgDuration}ms | Min: ${minDuration}ms | Max: ${maxDuration}ms`);
    
    return {
      description,
      avgDuration,
      minDuration,
      maxDuration,
      successCount: successfulRuns.length,
      totalRuns: iterations
    };
  } else {
    console.log(`❌ All runs failed`);
    return { description, error: 'All runs failed', successCount: 0, totalRuns: iterations };
  }
}

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
    return false;
  }
}

async function benchmarkSlowQueries() {
  console.log('\n🚨 TESTING THE PROBLEMATIC QUERIES (These should be slow)');
  console.log('========================================================');
  
  const results = [];
  
  // Test 1: Total items count (the main culprit)
  results.push(await measureQuery(
    'Total items count (prisma.indexitem.count())',
    () => prisma.indexitem.count()
  ));
  
  // Test 2: Campus-specific counts (4 separate queries like the dashboard used to do)
  const campuses = ['Cañada College', 'College of San Mateo', 'Skyline College', 'District Office'];
  results.push(await measureQuery(
    'Campus counts - 4 separate queries (old dashboard approach)',
    async () => {
      const counts = await Promise.all(
        campuses.map(campus => prisma.indexitem.count({ where: { campus } }))
      );
      return counts;
    }
  ));
  
  // Test 3: Recent items count
  results.push(await measureQuery(
    'Recent items count (last 7 days)',
    () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return prisma.indexitem.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      });
    }
  ));
  
  // Test 4: Simulate the old dashboard approach (6 count queries)
  results.push(await measureQuery(
    'OLD DASHBOARD SIMULATION (6 count queries in sequence)',
    async () => {
      const totalItems = await prisma.indexitem.count();
      const campusCounts = await Promise.all(
        campuses.map(campus => prisma.indexitem.count({ where: { campus } }))
      );
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentItems = await prisma.indexitem.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      });
      
      return { totalItems, campusCounts, recentItems };
    }
  ));
  
  return results;
}

async function testOptimizedQueries() {
  console.log('\n⚡ TESTING OPTIMIZED QUERIES (Using our QueryCache)');
  console.log('==================================================');
  
  // Import our QueryCache 
  const { QueryCache } = require('./src/lib/query-cache.ts');
  
  const results = [];
  
  // Test the optimized versions
  results.push(await measureQuery(
    'QueryCache.getTotalItemsCount() - with caching',
    () => QueryCache.getTotalItemsCount()
  ));
  
  results.push(await measureQuery(
    'QueryCache.getCampusItemsCounts() - cached campus counts',
    () => QueryCache.getCampusItemsCounts()
  ));
  
  results.push(await measureQuery(
    'QueryCache.getRecentItemsCount() - cached recent count',
    () => QueryCache.getRecentItemsCount()
  ));
  
  results.push(await measureQuery(
    'QueryCache.getDashboardStats() - optimized dashboard (all stats)',
    () => QueryCache.getDashboardStats()
  ));
  
  // Test cache warming
  results.push(await measureQuery(
    'QueryCache.warmUpCaches() - populate all caches',
    () => QueryCache.warmUpCaches()
  ));
  
  return results;
}

async function main() {
  console.log('🚀 SMCCCD Site Index Database Performance Benchmark');
  console.log('===================================================');
  console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown'}`);
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  // Test connection first
  const connected = await testDatabaseConnection();
  if (!connected) {
    console.log('Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Get basic database info
  try {
    const totalRecords = await prisma.indexitem.count();
    console.log(`📊 Database contains ${totalRecords} total index items`);
  } catch (error) {
    console.log(`❌ Could not get record count: ${error.message}`);
  }
  
  // Test slow queries (baseline)
  const slowResults = await benchmarkSlowQueries();
  
  // Test optimized queries
  const fastResults = await testOptimizedQueries();
  
  // Generate comparison report
  console.log('\n🎯 PERFORMANCE COMPARISON');
  console.log('=========================');
  
  const dashboardOld = slowResults.find(r => r.description.includes('OLD DASHBOARD'));
  const dashboardNew = fastResults.find(r => r.description.includes('getDashboardStats'));
  
  if (dashboardOld && dashboardNew && !dashboardOld.error && !dashboardNew.error) {
    const improvement = Math.round(((dashboardOld.avgDuration - dashboardNew.avgDuration) / dashboardOld.avgDuration) * 100);
    const speedup = Math.round(dashboardOld.avgDuration / dashboardNew.avgDuration);
    
    console.log(`📈 DASHBOARD PERFORMANCE:`);
    console.log(`   Before optimization: ${dashboardOld.avgDuration}ms`);
    console.log(`   After optimization:  ${dashboardNew.avgDuration}ms`);
    console.log(`   Improvement: ${improvement}% faster (${speedup}x speedup)`);
    console.log(`   Status: ${dashboardNew.avgDuration <= 100 ? '✅ EXCELLENT' : dashboardNew.avgDuration <= 500 ? '✅ GOOD' : '⚠️ NEEDS WORK'}`);
  }
  
  // Alert analysis
  console.log(`\n🚨 PERFORMANCE ALERT ANALYSIS:`);
  console.log(`   Your alerts showed 567ms-997ms database response times`);
  console.log(`   Target: <100ms for optimal performance`);
  
  const countQuery = slowResults.find(r => r.description.includes('Total items count'));
  if (countQuery && !countQuery.error) {
    console.log(`   Current count query: ${countQuery.avgDuration}ms`);
    console.log(`   Status: ${countQuery.avgDuration <= 100 ? '✅ FIXED' : countQuery.avgDuration <= 500 ? '⚠️ IMPROVED' : '❌ STILL SLOW'}`);
  }
  
  console.log(`\n⏰ Benchmark completed at ${new Date().toISOString()}`);
  
  // Cleanup
  await prisma.$disconnect();
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(async (error) => {
  console.error('💥 Benchmark failed:', error);
  await prisma.$disconnect();
  process.exit(1);
});