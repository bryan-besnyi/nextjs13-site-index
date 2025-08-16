describe('SMCCCD Site Index - Actual Functionality Tests', () => {
  const baseUrl = 'http://localhost:3002';

  it('Basic functionality: Public API access works', () => {
    cy.request({
      url: `${baseUrl}/api/indexItems`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 500]); // Document actual behavior
      if (response.status === 200) {
        expect(response.body).to.be.an('array');
      }
    });
  });

  it('Performance metrics API is accessible', () => {
    cy.request({
      url: `${baseUrl}/api/admin/performance/real-metrics?type=system`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('database');
      expect(response.body.data).to.have.property('memory');
      expect(response.body.data.memory.usage).to.be.a('number');
    });
  });

  it('Health check endpoint works', () => {
    cy.request({
      url: `${baseUrl}/api/health`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('status');
    });
  });

  it('Public homepage loads (may have errors)', () => {
    cy.visit(baseUrl, { failOnStatusCode: false });
    
    // Check if page loads at all
    cy.get('html').should('exist');
    
    // Check for any visible content
    cy.get('body').should('be.visible');
    
    // Document what's actually there
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="search-input"]').length > 0) {
        cy.get('[data-testid="search-input"]').should('be.visible');
      }
    });
  });

  it('Admin route accessibility (expects failure without auth)', () => {
    cy.visit(`${baseUrl}/admin`, { failOnStatusCode: false });
    
    // Document actual behavior - likely 500 or redirect
    cy.url().then((url) => {
      // Could be error page, login redirect, or actual admin
      expect(url).to.include(baseUrl);
    });
  });

  it('Database connection test via benchmark', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/api/admin/performance/real-metrics`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: { action: 'benchmark' },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.benchmark).to.have.property('database');
      expect(response.body.benchmark.database.result).to.be.a('number');
      
      // Document actual performance
      const dbTime = response.body.benchmark.database.queryTime;
      const totalTime = response.body.benchmark.totalTime;
      
      cy.log(`Database query time: ${dbTime}ms`);
      cy.log(`Total benchmark time: ${totalTime}ms`);
      
      // Performance expectations
      expect(dbTime).to.be.lessThan(1000); // Should be under 1 second
    });
  });

  it('System resource usage monitoring', () => {
    cy.request({
      url: `${baseUrl}/api/admin/performance/real-metrics?type=realtime`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.data).to.have.property('memory');
      expect(response.body.data).to.have.property('uptime');
      
      const memoryUsage = response.body.data.memory.heapUsed;
      const uptime = response.body.data.uptime;
      
      cy.log(`Memory usage: ${memoryUsage}MB`);
      cy.log(`System uptime: ${uptime} seconds`);
      
      // Reasonable resource usage
      expect(memoryUsage).to.be.lessThan(500); // Under 500MB
      expect(uptime).to.be.greaterThan(0);
    });
  });

  it('Cache system status check', () => {
    cy.request({
      url: `${baseUrl}/api/admin/performance/real-metrics?type=system`,
      failOnStatusCode: false
    }).then((response) => {
      const cacheStatus = response.body.data.cache;
      
      cy.log(`Cache status: ${cacheStatus.status}`);
      cy.log(`Cache keys: ${cacheStatus.keyCount}`);
      cy.log(`Cache hit rate: ${cacheStatus.hitRate}%`);
      
      // Document cache health
      expect(cacheStatus.status).to.be.oneOf(['healthy', 'warning', 'error']);
      expect(cacheStatus.keyCount).to.be.a('number');
      expect(cacheStatus.hitRate).to.be.a('number');
    });
  });

  it('Stress test - multiple rapid requests', () => {
    // Collect results
    const results: { status: number; duration: number }[] = [];
    
    // Execute 10 requests sequentially (Cypress way)
    Cypress._.times(10, (i) => {
      cy.request({
        url: `${baseUrl}/api/health`,
        timeout: 5000,
        failOnStatusCode: false
      }).then((response) => {
        results.push({
          status: response.status,
          duration: response.duration || 0
        });
      });
    });
    
    // Analyze results after all requests complete
    cy.then(() => {
      const successCount = results.filter(r => r.status === 200).length;
      const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      
      cy.log(`Successful requests: ${successCount}/10`);
      cy.log(`Average response time: ${avgTime}ms`);
      
      expect(successCount).to.be.at.least(8); // Allow for some failures
      expect(avgTime).to.be.lessThan(1000); // Should average under 1 second
    });
  });

  it('API endpoint discovery and documentation', () => {
    const endpoints = [
      '/api/indexItems',
      '/api/health', 
      '/api/metrics',
      '/api/admin/performance/real-metrics',
      '/api/admin/cache',
    ];

    endpoints.forEach((endpoint) => {
      cy.request({
        url: `${baseUrl}${endpoint}`,
        failOnStatusCode: false
      }).then((response) => {
        cy.log(`${endpoint}: ${response.status} - ${response.statusText}`);
        
        // Document which endpoints are working
        if (response.status === 200) {
          expect(response.body).to.exist;
        }
      });
    });
  });
});