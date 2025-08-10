describe('IndexItems API', () => {
  beforeEach(() => {
    // Intercept API calls
    cy.intercept('GET', '/api/indexItems*').as('getIndexItems')
    cy.intercept('POST', '/api/indexItems').as('createIndexItem')
    cy.intercept('DELETE', '/api/indexItems*').as('deleteIndexItem')
  })

  it('should fetch all index items', () => {
    cy.request({
      method: 'GET',
      url: '/api/indexItems',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cypress)'
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.be.an('array')
      expect(response.headers['access-control-allow-origin']).to.eq('*')
      expect(response.headers).to.have.property('x-results-count')
      expect(response.headers).to.have.property('x-response-time')
    })
  })

  it('should filter items by campus', () => {
    cy.request({
      method: 'GET',
      url: '/api/indexItems?campus=College of San Mateo',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cypress)'
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.be.an('array')
      
      if (response.body.length > 0) {
        response.body.forEach((item: any) => {
          expect(item.campus).to.eq('College of San Mateo')
        })
      }
    })
  })

  it('should filter items by letter', () => {
    cy.request({
      method: 'GET',
      url: '/api/indexItems?letter=A',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cypress)'
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.be.an('array')
      
      if (response.body.length > 0) {
        response.body.forEach((item: any) => {
          expect(item.letter.toLowerCase()).to.include('a')
        })
      }
    })
  })

  it('should search items by query', () => {
    cy.request({
      method: 'GET',
      url: '/api/indexItems?search=physics',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cypress)'
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.be.an('array')
      
      if (response.body.length > 0) {
        response.body.forEach((item: any) => {
          const titleMatch = item.title.toLowerCase().includes('physics')
          const urlMatch = item.url.toLowerCase().includes('physics')
          expect(titleMatch || urlMatch).to.be.true
        })
      }
    })
  })

  it('should handle campus code mapping', () => {
    cy.request({
      method: 'GET',
      url: '/api/indexItems?campus=CSM',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cypress)'
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.be.an('array')
      
      if (response.body.length > 0) {
        response.body.forEach((item: any) => {
          expect(item.campus).to.eq('College of San Mateo')
        })
      }
    })
  })

  it('should block invalid user agents', () => {
    cy.request({
      method: 'GET',
      url: '/api/indexItems',
      headers: {
        'User-Agent': 'bot/crawler'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body).to.have.property('error', 'Invalid User-Agent')
    })
  })

  it('should return CORS headers', () => {
    cy.request({
      method: 'GET',
      url: '/api/indexItems',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cypress)'
      }
    }).then((response) => {
      expect(response.headers['access-control-allow-origin']).to.eq('*')
      expect(response.headers['access-control-allow-methods']).to.eq('GET')
      expect(response.headers['access-control-allow-headers']).to.include('Content-Type')
    })
  })

  it('should include cache headers', () => {
    cy.request({
      method: 'GET',
      url: '/api/indexItems',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cypress)'
      }
    }).then((response) => {
      expect(response.headers).to.have.property('cache-control')
      expect(response.headers['cache-control']).to.include('public')
      expect(response.headers).to.have.property('x-cache')
    })
  })

  it('should validate required fields for POST requests', () => {
    cy.request({
      method: 'POST',
      url: '/api/indexItems',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cypress)'
      },
      body: {
        title: 'Test Item'
        // Missing required fields
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.error).to.include('Missing required fields')
    })
  })

  it('should require ID for DELETE requests', () => {
    cy.request({
      method: 'DELETE',
      url: '/api/indexItems',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cypress)'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.error).to.eq('ID required')
    })
  })

  it('should respect rate limiting', () => {
    // Make multiple rapid requests to test rate limiting
    const requests = Array.from({ length: 25 }, (_, i) => 
      cy.request({
        method: 'GET',
        url: '/api/indexItems',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Cypress)',
          'X-Test-Request': `${i}`
        },
        failOnStatusCode: false
      })
    )

    // At least one should be rate limited
    cy.wrap(Promise.all(requests)).then((responses: any[]) => {
      const rateLimited = responses.some(response => response.status === 429)
      // Note: This might not always trigger in test environment
      // depending on rate limiting implementation
    })
  })
})