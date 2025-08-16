const https = require('http');

async function makeRequest(url) {
  const start = Date.now();
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const time = Date.now() - start;
        resolve({
          time,
          cacheHit: res.headers['x-cache'] === 'HIT',
          responseTime: res.headers['x-response-time']
        });
      });
    }).on('error', reject);
  });
}

async function testCachePerformance() {
  const baseUrl = 'http://localhost:3002/api/indexItems/v2';
  const tests = [
    { name: 'All items', url: baseUrl },
    { name: 'Letter A', url: `${baseUrl}?letter=A` },
    { name: 'CSM campus', url: `${baseUrl}?campus=College of San Mateo` },
    { name: 'Search financial', url: `${baseUrl}?search=financial` },
  ];
  
  console.log('🚀 Testing cache performance...\n');
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    
    // First request (might be cache miss)
    const result1 = await makeRequest(test.url);
    console.log(`  First request: ${result1.time}ms (Cache: ${result1.cacheHit ? 'HIT' : 'MISS'})`);
    
    // Second request (should be cache hit)
    const result2 = await makeRequest(test.url);
    console.log(`  Second request: ${result2.time}ms (Cache: ${result2.cacheHit ? 'HIT' : 'MISS'})`);
    
    const improvement = ((result1.time - result2.time) / result1.time * 100).toFixed(1);
    console.log(`  Performance improvement: ${improvement}%\n`);
  }
}

testCachePerformance().catch(console.error);