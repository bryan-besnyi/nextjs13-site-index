const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://site-index-git-develop-smcccd.vercel.app';
const isLocalhost = BASE_URL.includes('localhost');
const protocol = isLocalhost ? http : https;

// Parse URL
const url = new URL(BASE_URL);
const options = {
  hostname: url.hostname,
  port: url.port || (isLocalhost ? 80 : 443),
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'TestTrafficGenerator/1.0'
  }
};

// Endpoints to test
const endpoints = [
  { path: '/api/indexItems', method: 'GET', params: '?campus=Skyline%20College' },
  { path: '/api/indexItems', method: 'GET', params: '?letter=A' },
  { path: '/api/indexItems', method: 'GET', params: '?campus=College%20of%20San%20Mateo&letter=B' },
  { path: '/api/indexItems', method: 'GET', params: '?search=library' },
  { path: '/api/health', method: 'GET' },
  { path: '/api/metrics', method: 'GET' },
];

// Helper to make requests
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const reqOptions = {
      ...options,
      path: endpoint.path + (endpoint.params || ''),
      method: endpoint.method
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`✓ ${endpoint.method} ${endpoint.path}${endpoint.params || ''} - ${res.statusCode} (${duration}ms)`);
        resolve({ endpoint, status: res.statusCode, duration });
      });
    });

    req.on('error', (error) => {
      console.error(`✗ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`);
      reject(error);
    });

    req.end();
  });
}

// Generate traffic
async function generateTraffic() {
  console.log(`🚀 Generating test traffic to: ${BASE_URL}`);
  console.log('━'.repeat(60));

  // Burst of requests
  for (let wave = 1; wave <= 3; wave++) {
    console.log(`\n📊 Wave ${wave} of traffic...`);
    
    // Parallel requests
    const promises = [];
    for (let i = 0; i < 5; i++) {
      for (const endpoint of endpoints) {
        promises.push(makeRequest(endpoint));
      }
    }
    
    await Promise.all(promises);
    
    // Wait between waves
    if (wave < 3) {
      console.log(`⏳ Waiting 2 seconds before next wave...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '━'.repeat(60));
  console.log('✅ Traffic generation complete!');
  console.log(`📈 Total requests sent: ${3 * 5 * endpoints.length}`);
}

// Run the generator
generateTraffic().catch(console.error);