#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const CONCURRENT_REQUESTS = 10;
const TOTAL_REQUESTS = 100;

// Test scenarios
const TEST_SCENARIOS = [
  { name: 'Get All Items', path: '/api/indexItems' },
  { name: 'Filter by Campus', path: '/api/indexItems?campus=College+of+San+Mateo' },
  { name: 'Filter by Letter', path: '/api/indexItems?letter=A' },
  { name: 'Search Query', path: '/api/indexItems?search=physics' },
  { name: 'Combined Filters', path: '/api/indexItems?campus=Skyline+College&letter=B' },
  { name: 'Health Check', path: '/api/health' }
];

class PerformanceTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = {};
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const startTime = process.hrtime.bigint();
      const url = `${this.baseUrl}${path}`;
      const client = this.baseUrl.startsWith('https') ? https : http;

      const req = client.get(url, {
        headers: {
          'User-Agent': 'Performance-Test/1.0'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        
        res.on('end', () => {
          const endTime = process.hrtime.bigint();
          const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
          
          resolve({
            statusCode: res.statusCode,
            responseTime,
            contentLength: data.length,
            cacheStatus: res.headers['x-cache'] || 'UNKNOWN',
            dbTime: res.headers['x-db-time'] || null,
            cacheTime: res.headers['x-cache-time'] || null,
            resultCount: res.headers['x-results-count'] || null
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async runTest(scenario, requestCount = TOTAL_REQUESTS, concurrency = CONCURRENT_REQUESTS) {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    console.log(`📊 Requests: ${requestCount}, Concurrency: ${concurrency}`);
    
    const results = [];
    const batches = Math.ceil(requestCount / concurrency);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, requestCount - (batch * concurrency));
      const batchPromises = [];
      
      for (let i = 0; i < batchSize; i++) {
        batchPromises.push(this.makeRequest(scenario.path));
      }
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        const completed = (batch + 1) * batchSize;
        const progress = Math.round((completed / requestCount) * 100);
        process.stdout.write(`\r⏳ Progress: ${progress}% (${completed}/${requestCount})`);
      } catch (error) {
        console.error(`\n❌ Batch ${batch + 1} failed:`, error.message);
      }
    }
    
    console.log('\n');
    return this.analyzeResults(scenario.name, results);
  }

  analyzeResults(scenarioName, results) {
    if (results.length === 0) {
      console.log('❌ No results to analyze');
      return null;
    }

    const responseTimes = results.map(r => r.responseTime);
    const successful = results.filter(r => r.statusCode === 200);
    const cached = results.filter(r => r.cacheStatus === 'HIT');
    const dbTimes = results.filter(r => r.dbTime).map(r => parseFloat(r.dbTime));
    
    responseTimes.sort((a, b) => a - b);
    
    const stats = {
      scenario: scenarioName,
      totalRequests: results.length,
      successfulRequests: successful.length,
      failedRequests: results.length - successful.length,
      successRate: (successful.length / results.length) * 100,
      cacheHitRate: cached.length > 0 ? (cached.length / results.length) * 100 : 0,
      
      responseTime: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        median: responseTimes[Math.floor(responseTimes.length / 2)],
        p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
        p99: responseTimes[Math.floor(responseTimes.length * 0.99)]
      },
      
      throughput: {
        requestsPerSecond: results.length / (Math.max(...responseTimes) / 1000)
      }
    };

    if (dbTimes.length > 0) {
      stats.dbTime = {
        avg: dbTimes.reduce((a, b) => a + b, 0) / dbTimes.length,
        min: Math.min(...dbTimes),
        max: Math.max(...dbTimes)
      };
    }

    // Pretty print results
    console.log(`📈 Results for ${scenarioName}:`);
    console.log(`   Success Rate: ${stats.successRate.toFixed(1)}% (${stats.successfulRequests}/${stats.totalRequests})`);
    console.log(`   Cache Hit Rate: ${stats.cacheHitRate.toFixed(1)}%`);
    console.log(`   Response Time (ms):`);
    console.log(`     Min: ${stats.responseTime.min.toFixed(2)}`);
    console.log(`     Avg: ${stats.responseTime.avg.toFixed(2)}`);
    console.log(`     P95: ${stats.responseTime.p95.toFixed(2)}`);
    console.log(`     P99: ${stats.responseTime.p99.toFixed(2)}`);
    console.log(`     Max: ${stats.responseTime.max.toFixed(2)}`);
    
    if (stats.dbTime) {
      console.log(`   DB Query Time (ms): ${stats.dbTime.avg.toFixed(2)} avg, ${stats.dbTime.max.toFixed(2)} max`);
    }
    
    // Performance assessment
    const avgResponseTime = stats.responseTime.avg;
    if (avgResponseTime < 100) {
      console.log(`   🚀 Excellent performance!`);
    } else if (avgResponseTime < 300) {
      console.log(`   ✅ Good performance`);
    } else if (avgResponseTime < 1000) {
      console.log(`   ⚠️  Moderate performance - consider optimization`);
    } else {
      console.log(`   🐌 Poor performance - optimization needed`);
    }
    
    return stats;
  }

  async runAllTests() {
    console.log(`🎯 Starting performance tests against: ${this.baseUrl}`);
    console.log(`📝 Test Configuration: ${TOTAL_REQUESTS} requests, ${CONCURRENT_REQUESTS} concurrent`);
    
    const allResults = [];
    
    for (const scenario of TEST_SCENARIOS) {
      const result = await this.runTest(scenario);
      if (result) {
        allResults.push(result);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.printSummary(allResults);
    return allResults;
  }

  printSummary(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE SUMMARY');
    console.log('='.repeat(60));
    
    results.forEach(result => {
      console.log(`${result.scenario.padEnd(20)} | ${result.responseTime.avg.toFixed(0)}ms avg | ${result.successRate.toFixed(0)}% success | ${result.cacheHitRate.toFixed(0)}% cache`);
    });
    
    const overallAvg = results.reduce((sum, r) => sum + r.responseTime.avg, 0) / results.length;
    const overallSuccess = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
    
    console.log('-'.repeat(60));
    console.log(`Overall Average: ${overallAvg.toFixed(2)}ms response time, ${overallSuccess.toFixed(1)}% success rate`);
  }
}

// Run tests
if (require.main === module) {
  const tester = new PerformanceTester(BASE_URL);
  
  tester.runAllTests()
    .then(() => {
      console.log('\n✅ Performance tests completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Performance tests failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceTester;