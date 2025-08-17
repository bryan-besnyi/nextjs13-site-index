// This script manually creates KV entries to simulate performance data
// Run this directly on Vercel or with proper KV environment variables

const mockMetrics = {
  // API call metrics
  'metrics:api:calls:today': 1250,
  'metrics:api:calls:week': 8500,
  'metrics:api:calls:month': 34000,
  'metrics:api:response_time:avg': 125,
  'metrics:api:error_rate': 0.02,
  
  // Cache metrics
  'metrics:cache:hit_rate': 0.85,
  'metrics:cache:miss_rate': 0.15,
  
  // Database metrics
  'metrics:db:queries:today': 3200,
  'metrics:db:response_time:avg': 45,
  
  // Endpoint metrics
  'metrics:endpoint:/api/indexItems:calls': 980,
  'metrics:endpoint:/api/indexItems:total_time': 98000,
  'metrics:endpoint:/api/indexItems:errors': 5,
  'metrics:endpoint:/api/health:calls': 150,
  'metrics:endpoint:/api/health:total_time': 6750,
  'metrics:endpoint:/api/health:errors': 0,
  'metrics:endpoint:/api/metrics:calls': 120,
  'metrics:endpoint:/api/metrics:total_time': 9600,
  'metrics:endpoint:/api/metrics:errors': 1,
};

// Generate hourly metrics for 24 hours
for (let i = 0; i < 24; i++) {
  const hour = i;
  const calls = Math.floor(30 + Math.random() * 100);
  const avgTime = Math.floor(80 + Math.random() * 100);
  
  mockMetrics[`metrics:hourly:${hour}:calls`] = calls;
  mockMetrics[`metrics:hourly:${hour}:avg_time`] = avgTime;
}

// Generate daily metrics for 30 days
const now = new Date();
for (let i = 0; i < 30; i++) {
  const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
  const dateKey = date.toISOString().split('T')[0];
  const calls = Math.floor(800 + Math.random() * 600);
  
  mockMetrics[`metrics:daily:${dateKey}:calls`] = calls;
}

// Campus metrics
const campuses = [
  { name: 'Skyline College', calls: 450, previousCalls: 380 },
  { name: 'College of San Mateo', calls: 420, previousCalls: 400 },
  { name: 'Cañada College', calls: 280, previousCalls: 250 },
  { name: 'District Office', calls: 100, previousCalls: 120 }
];

campuses.forEach(campus => {
  mockMetrics[`metrics:campus:${campus.name}:calls:month`] = campus.calls;
  mockMetrics[`metrics:campus:${campus.name}:calls:previous:month`] = campus.previousCalls;
});

console.log('Mock KV data ready for import:');
console.log(JSON.stringify(mockMetrics, null, 2));

console.log('\n📋 To populate this data in KV:');
console.log('1. Go to your Vercel dashboard');
console.log('2. Navigate to your KV store');
console.log('3. Manually add these key-value pairs, or');
console.log('4. Use the Vercel CLI: vercel kv:set key value');

console.log('\n🚀 Sample commands:');
Object.entries(mockMetrics).slice(0, 5).forEach(([key, value]) => {
  console.log(`vercel kv:set "${key}" "${value}"`);
});
console.log('... and so on for all entries');

module.exports = mockMetrics;