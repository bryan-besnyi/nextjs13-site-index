describe('Health Check API', () => {
  it('should return healthy status', () => {
    cy.request('/api/health').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.headers['content-type']).to.include('application/health+json')
      expect(response.body).to.have.property('status')
      expect(response.body.status).to.be.oneOf(['pass', 'warn'])
      expect(response.body).to.have.property('serviceId', 'smcccd-site-index')
      expect(response.body).to.have.property('checks')
    })
  })

  it('should include all required health checks', () => {
    cy.request('/api/health').then((response) => {
      const { checks } = response.body
      
      // Database check
      expect(checks).to.have.property('database')
      expect(checks.database[0]).to.have.property('componentType', 'datastore')
      expect(checks.database[0]).to.have.property('status')
      
      // Cache check
      expect(checks).to.have.property('cache')
      expect(checks.cache[0]).to.have.property('componentType', 'component')
      
      // API check
      expect(checks).to.have.property('api')
      expect(checks.api[0]).to.have.property('componentType', 'component')
      
      // System check
      expect(checks).to.have.property('system')
      expect(checks.system[0]).to.have.property('componentType', 'system')
    })
  })

  it('should respond to HEAD requests', () => {
    cy.request({
      method: 'HEAD',
      url: '/api/health'
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.be.empty
    })
  })

  it('should include performance headers', () => {
    cy.request('/api/health').then((response) => {
      expect(response.headers).to.have.property('x-response-time')
      expect(response.headers).to.have.property('x-health-check-time')
      expect(response.headers['cache-control']).to.include('no-cache')
    })
  })
})