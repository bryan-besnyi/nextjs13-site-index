const { kv } = require('@vercel/kv');

async function populateMetrics() {
  console.log('🔄 Populating performance metrics in KV store...');
  
  try {
    // Current metrics
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    
    // API call metrics
    await kv.set('metrics:api:calls:today', 1250);
    await kv.set('metrics:api:calls:week', 8500);
    await kv.set('metrics:api:calls:month', 34000);
    await kv.set('metrics:api:response_time:avg', 125);
    await kv.set('metrics:api:error_rate', 0.02);
    
    // Cache metrics
    await kv.set('metrics:cache:hit_rate', 0.85);
    await kv.set('metrics:cache:miss_rate', 0.15);
    
    // Database metrics
    await kv.set('metrics:db:queries:today', 3200);
    await kv.set('metrics:db:response_time:avg', 45);
    
    // Endpoint-specific metrics
    const endpoints = [
      { path: '/api/indexItems', calls: 980, totalTime: 98000, errors: 5 },
      { path: '/api/health', calls: 150, totalTime: 6750, errors: 0 },
      { path: '/api/metrics', calls: 120, totalTime: 9600, errors: 1 }
    ];
    
    for (const endpoint of endpoints) {
      await kv.set(`metrics:endpoint:${endpoint.path}:calls`, endpoint.calls);
      await kv.set(`metrics:endpoint:${endpoint.path}:total_time`, endpoint.totalTime);
      await kv.set(`metrics:endpoint:${endpoint.path}:errors`, endpoint.errors);
    }
    
    // Hourly metrics for the last 24 hours
    for (let i = 0; i < 24; i++) {
      const hour = (currentHour - i + 24) % 24;
      const calls = Math.floor(30 + Math.random() * 100); // 30-130 calls per hour
      const avgTime = Math.floor(80 + Math.random() * 100); // 80-180ms avg
      
      await kv.set(`metrics:hourly:${hour}:calls`, calls);
      await kv.set(`metrics:hourly:${hour}:avg_time`, avgTime);
    }
    
    // Daily metrics for time series
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateKey = date.toISOString().split('T')[0];
      const calls = Math.floor(800 + Math.random() * 600); // 800-1400 calls per day
      
      await kv.set(`metrics:daily:${dateKey}:calls`, calls);
    }
    
    // Campus metrics
    const campuses = [
      { name: 'Skyline College', calls: 450, previousCalls: 380 },
      { name: 'College of San Mateo', calls: 420, previousCalls: 400 },
      { name: 'Cañada College', calls: 280, previousCalls: 250 },
      { name: 'District Office', calls: 100, previousCalls: 120 }
    ];
    
    for (const campus of campuses) {
      await kv.set(`metrics:campus:${campus.name}:calls:month`, campus.calls);
      await kv.set(`metrics:campus:${campus.name}:calls:previous:month`, campus.previousCalls);
    }
    
    console.log('✅ Performance metrics populated successfully!');
    console.log(`📊 Metrics summary:`);
    console.log(`   - API calls today: 1,250`);
    console.log(`   - Average response time: 125ms`);
    console.log(`   - Cache hit rate: 85%`);
    console.log(`   - Error rate: 2%`);
    console.log(`   - Endpoints tracked: ${endpoints.length}`);
    console.log(`   - Hourly data points: 24`);
    console.log(`   - Daily data points: 30`);
    
  } catch (error) {
    console.error('❌ Error populating metrics:', error);
  }
}

// Run if called directly
if (require.main === module) {
  populateMetrics();
}

module.exports = { populateMetrics };