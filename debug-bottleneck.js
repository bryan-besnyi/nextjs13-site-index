#!/usr/bin/env node

/**
 * Debug Database Bottlenecks
 * 
 * Step-by-step analysis to find the root cause of slow queries
 */

const { PrismaClient } = require('@prisma/client');
const { performance } = require('perf_hooks');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function debugStep(step, description, fn) {
  console.log(`\n${step}. ${description}`);
  console.log('=' .repeat(50));
  
  const start = performance.now();
  try {
    const result = await fn();
    const duration = Math.round(performance.now() - start);
    console.log(`✅ Completed in ${duration}ms`);
    return { success: true, duration, result };
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    console.log(`❌ Failed in ${duration}ms: ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

async function analyzeTableStructure() {
  console.log('\n🔍 ANALYZING TABLE STRUCTURE');
  console.log('============================');
  
  // Check table size and structure
  const tableInfo = await debugStep('1', 'Get table information', async () => {
    const result = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        attname as column_name,
        typname as data_type,
        attnotnull as not_null
      FROM pg_attribute 
      JOIN pg_type ON pg_attribute.atttypid = pg_type.oid
      JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
      JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
      WHERE pg_class.relname = 'indexitem'
      AND pg_attribute.attnum > 0
      AND NOT pg_attribute.attisdropped
      ORDER BY pg_attribute.attnum;
    `;
    
    console.log('Table structure:');
    result.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.not_null ? 'NOT NULL' : 'NULL'}`);
    });
    
    return result;
  });
  
  // Check indexes
  const indexes = await debugStep('2', 'Check existing indexes', async () => {
    const result = await prisma.$queryRaw`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'indexitem'
      ORDER BY indexname;
    `;
    
    console.log('Existing indexes:');
    result.forEach(idx => {
      console.log(`  ${idx.indexname}: ${idx.indexdef}`);
    });
    
    return result;
  });
  
  // Check table statistics
  const stats = await debugStep('3', 'Get table statistics', async () => {
    const result = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables 
      WHERE relname = 'indexitem';
    `;
    
    console.log('Table statistics:');
    if (result.length > 0) {
      const stat = result[0];
      console.log(`  Live tuples: ${stat.live_tuples}`);
      console.log(`  Dead tuples: ${stat.dead_tuples}`);
      console.log(`  Last analyze: ${stat.last_analyze || 'Never'}`);
      console.log(`  Last vacuum: ${stat.last_vacuum || 'Never'}`);
    }
    
    return result;
  });
}

async function analyzeQueryPerformance() {
  console.log('\n⚡ ANALYZING QUERY PERFORMANCE');
  console.log('==============================');
  
  // Test 1: Simple SELECT 1
  await debugStep('1', 'Test basic connection (SELECT 1)', async () => {
    return await prisma.$queryRaw`SELECT 1 as test`;
  });
  
  // Test 2: Simple table scan
  await debugStep('2', 'Test simple table access (SELECT * LIMIT 1)', async () => {
    return await prisma.$queryRaw`SELECT * FROM indexitem LIMIT 1`;
  });
  
  // Test 3: Count with EXPLAIN
  await debugStep('3', 'Analyze COUNT query with EXPLAIN', async () => {
    const explain = await prisma.$queryRaw`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
      SELECT COUNT(*) FROM indexitem;
    `;
    
    console.log('Query execution plan:');
    console.log(JSON.stringify(explain[0], null, 2));
    
    return explain;
  });
  
  // Test 4: Count by campus with EXPLAIN
  await debugStep('4', 'Analyze campus COUNT with EXPLAIN', async () => {
    const explain = await prisma.$queryRaw`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
      SELECT COUNT(*) FROM indexitem WHERE campus = 'College of San Mateo';
    `;
    
    console.log('Campus query execution plan:');
    console.log(JSON.stringify(explain[0], null, 2));
    
    return explain;
  });
  
  // Test 5: Test different count approaches
  await debugStep('5', 'Compare COUNT strategies', async () => {
    const strategies = [];
    
    // Strategy 1: Regular COUNT
    let start = performance.now();
    const count1 = await prisma.$queryRaw`SELECT COUNT(*) FROM indexitem`;
    strategies.push({ method: 'COUNT(*)', time: Math.round(performance.now() - start), result: count1[0].count });
    
    // Strategy 2: COUNT with index hint
    start = performance.now();
    const count2 = await prisma.$queryRaw`SELECT COUNT(id) FROM indexitem`;
    strategies.push({ method: 'COUNT(id)', time: Math.round(performance.now() - start), result: count2[0].count });
    
    // Strategy 3: Approximate count from stats
    start = performance.now();
    const count3 = await prisma.$queryRaw`
      SELECT n_live_tup as approx_count 
      FROM pg_stat_user_tables 
      WHERE relname = 'indexitem'
    `;
    strategies.push({ method: 'pg_stat estimate', time: Math.round(performance.now() - start), result: count3[0]?.approx_count || 0 });
    
    console.log('Count strategy comparison:');
    strategies.forEach(s => {
      console.log(`  ${s.method}: ${s.time}ms (result: ${s.result})`);
    });
    
    return strategies;
  });
}

async function analyzeNetworkLatency() {
  console.log('\n🌐 ANALYZING NETWORK LATENCY');
  console.log('============================');
  
  // Test multiple small queries to isolate network vs computation
  await debugStep('1', 'Test network latency (10 simple queries)', async () => {
    const times = [];
    
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      times.push(Math.round(performance.now() - start));
    }
    
    const avg = Math.round(times.reduce((a, b) => a + b) / times.length);
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`Network latency analysis:`);
    console.log(`  Individual times: ${times.join(', ')}ms`);
    console.log(`  Average: ${avg}ms, Min: ${min}ms, Max: ${max}ms`);
    
    return { avg, min, max, times };
  });
  
  // Test connection pooling
  await debugStep('2', 'Test connection pooling', async () => {
    const start = performance.now();
    
    // Run 5 queries in parallel
    const promises = Array(5).fill().map(() => 
      prisma.$queryRaw`SELECT 1`
    );
    
    await Promise.all(promises);
    const total = Math.round(performance.now() - start);
    
    console.log(`5 parallel queries completed in ${total}ms`);
    console.log(`Average per query: ${Math.round(total / 5)}ms`);
    
    return { total, avgPerQuery: Math.round(total / 5) };
  });
}

async function analyzeDataDistribution() {
  console.log('\n📊 ANALYZING DATA DISTRIBUTION');
  console.log('===============================');
  
  // Check data distribution by campus
  await debugStep('1', 'Analyze campus distribution', async () => {
    const distribution = await prisma.$queryRaw`
      SELECT 
        campus,
        COUNT(*) as count,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM indexitem 
      GROUP BY campus 
      ORDER BY count DESC;
    `;
    
    console.log('Campus distribution:');
    distribution.forEach(row => {
      console.log(`  ${row.campus}: ${row.count} items (${parseFloat(row.percentage).toFixed(1)}%)`);
    });
    
    return distribution;
  });
  
  // Check letter distribution
  await debugStep('2', 'Analyze letter distribution', async () => {
    const distribution = await prisma.$queryRaw`
      SELECT 
        letter,
        COUNT(*) as count
      FROM indexitem 
      GROUP BY letter 
      ORDER BY count DESC 
      LIMIT 10;
    `;
    
    console.log('Top 10 letters by frequency:');
    distribution.forEach(row => {
      console.log(`  ${row.letter}: ${row.count} items`);
    });
    
    return distribution;
  });
  
  // Check for data quality issues
  await debugStep('3', 'Check data quality', async () => {
    const quality = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN title = '' OR title IS NULL THEN 1 END) as empty_titles,
        COUNT(CASE WHEN url = '' OR url IS NULL THEN 1 END) as empty_urls,
        COUNT(CASE WHEN campus = '' OR campus IS NULL THEN 1 END) as empty_campus,
        COUNT(CASE WHEN letter = '' OR letter IS NULL THEN 1 END) as empty_letters,
        AVG(LENGTH(title)) as avg_title_length,
        AVG(LENGTH(url)) as avg_url_length
      FROM indexitem;
    `;
    
    const q = quality[0];
    console.log('Data quality analysis:');
    console.log(`  Total records: ${q.total}`);
    console.log(`  Empty titles: ${q.empty_titles}`);
    console.log(`  Empty URLs: ${q.empty_urls}`);
    console.log(`  Empty campus: ${q.empty_campus}`);
    console.log(`  Empty letters: ${q.empty_letters}`);
    console.log(`  Avg title length: ${Math.round(q.avg_title_length)} chars`);
    console.log(`  Avg URL length: ${Math.round(q.avg_url_length)} chars`);
    
    return quality;
  });
}

async function main() {
  console.log('🔬 DATABASE BOTTLENECK ANALYSIS');
  console.log('=================================');
  console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown'}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  try {
    // Step-by-step debugging
    await analyzeTableStructure();
    await analyzeQueryPerformance();
    await analyzeNetworkLatency();
    await analyzeDataDistribution();
    
    console.log('\n🎯 BOTTLENECK SUMMARY');
    console.log('=====================');
    console.log('Check the analysis above to identify:');
    console.log('1. Missing indexes that could speed up COUNT queries');
    console.log('2. Network latency vs database computation time');
    console.log('3. Whether table statistics are up to date');
    console.log('4. Data distribution that might affect query planning');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);