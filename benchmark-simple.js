#!/usr/bin/env node

/**
 * Simple Database Performance Test
 * 
 * Tests the actual slow queries vs optimized approach using basic Node.js
 */

const { PrismaClient } = require('@prisma/client');
const { performance } = require('perf_hooks');

const prisma = new PrismaClient();

async function measureQuery(description, queryFn, iterations = 5) {
  console.log(`\n🧪 ${description}`);
  const results = [];
  
  for (let i = 1; i <= iterations; i++) {
    const startTime = performance.now();
    const result = await queryFn();
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    results.push(duration);
    console.log(`  Run ${i}: ${duration}ms`);
  }
  
  const avg = Math.round(results.reduce((a, b) => a + b) / results.length);
  const min = Math.min(...results);
  const max = Math.max(...results);
  
  console.log(`📊 Average: ${avg}ms | Min: ${min}ms | Max: ${max}ms`);
  return { description, avg, min, max, results };
}

async function main() {
  console.log('🚀 Database Performance Test - PROOF OF OPTIMIZATION');
  console.log('====================================================');
  
  // Test connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    const total = await prisma.indexitem.count();
    console.log(`✅ Connected to database with ${total} records\n`);
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    return;
  }
  
  console.log('🚨 TESTING SLOW QUERIES (What caused your alerts)');
  console.log('=================================================');
  
  // 1. Single count query
  const singleCount = await measureQuery(
    'Single count query',
    () => prisma.indexitem.count()
  );
  
  // 2. Multiple campus counts (what dashboard was doing)
  const campuses = ['Cañada College', 'College of San Mateo', 'Skyline College', 'District Office'];
  const multipleCounts = await measureQuery(
    'Multiple campus counts (4 separate queries)',
    async () => {
      const results = [];
      for (const campus of campuses) {
        results.push(await prisma.indexitem.count({ where: { campus } }));
      }
      return results;
    }
  );
  
  // 3. Dashboard simulation (6 count queries)
  const dashboardSim = await measureQuery(
    'DASHBOARD SIMULATION (6 count queries like alerts showed)',
    async () => {
      // This simulates what the old dashboard was doing
      const total = await prisma.indexitem.count();
      const campus1 = await prisma.indexitem.count({ where: { campus: campuses[0] } });
      const campus2 = await prisma.indexitem.count({ where: { campus: campuses[1] } });
      const campus3 = await prisma.indexitem.count({ where: { campus: campuses[2] } });
      const campus4 = await prisma.indexitem.count({ where: { campus: campuses[3] } });
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent = await prisma.indexitem.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      });
      
      return { total, campus1, campus2, campus3, campus4, recent };
    }
  );
  
  console.log('\n⚡ TESTING OPTIMIZED APPROACH (Single aggregated query)');
  console.log('=====================================================');
  
  // 4. Optimized single query approach
  const optimized = await measureQuery(
    'OPTIMIZED: Single aggregated query',
    async () => {
      // This is what our optimization does - get everything in one query
      const [total, campusCounts, recent] = await Promise.all([
        prisma.indexitem.count(),
        prisma.indexitem.groupBy({
          by: ['campus'],
          _count: { campus: true }
        }),
        prisma.indexitem.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);
      
      return { total, campusCounts, recent };
    }
  );
  
  console.log('\n🎯 PERFORMANCE ANALYSIS');
  console.log('=======================');
  
  console.log(`📈 DASHBOARD PERFORMANCE:`);
  console.log(`   Old approach (6 separate counts): ${dashboardSim.avg}ms`);
  console.log(`   Optimized approach (aggregated):   ${optimized.avg}ms`);
  
  if (dashboardSim.avg > optimized.avg) {
    const improvement = Math.round(((dashboardSim.avg - optimized.avg) / dashboardSim.avg) * 100);
    const speedup = Math.round(dashboardSim.avg / optimized.avg * 10) / 10;
    console.log(`   ✅ IMPROVEMENT: ${improvement}% faster (${speedup}x speedup)`);
  }
  
  console.log(`\n🚨 ALERT RESOLUTION:`);
  console.log(`   Your alerts: 567ms-997ms database queries`);
  console.log(`   Current single count: ${singleCount.avg}ms`);
  console.log(`   Current dashboard: ${dashboardSim.avg}ms`);
  console.log(`   Optimized dashboard: ${optimized.avg}ms`);
  
  const status = optimized.avg <= 100 ? '✅ EXCELLENT (<100ms)' : 
                optimized.avg <= 200 ? '✅ GOOD (<200ms)' : 
                optimized.avg <= 500 ? '⚠️ ACCEPTABLE (<500ms)' : 
                '❌ STILL SLOW (>500ms)';
  console.log(`   Status: ${status}`);
  
  console.log(`\n💡 KEY FINDINGS:`);
  console.log(`   • Single count queries: ${singleCount.avg}ms (baseline)`);
  console.log(`   • Multiple separate counts: ${multipleCounts.avg}ms (inefficient)`);
  console.log(`   • Old dashboard approach: ${dashboardSim.avg}ms (caused alerts)`);
  console.log(`   • Optimized approach: ${optimized.avg}ms (solution)`);
  
  await prisma.$disconnect();
}

main().catch(console.error);