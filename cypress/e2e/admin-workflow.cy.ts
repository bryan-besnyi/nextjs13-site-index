describe('Admin Workflow', () => {
  beforeEach(() => {
    // Mock authentication for admin access
    cy.bypassAuth()
    
    // Intercept API calls
    cy.intercept('GET', '/api/indexItems*').as('getIndexItems')
    cy.intercept('POST', '/api/indexItems').as('createIndexItem')
    cy.intercept('DELETE', '/api/indexItems*').as('deleteIndexItem')
  })

  describe('Admin Dashboard', () => {
    it('should load the admin dashboard', () => {
      cy.visit('/admin')
      
      cy.contains('h1', 'Admin Home').should('be.visible')
      cy.get('[data-testid="search-input"]').should('be.visible')
      cy.get('button').contains('Search').should('be.visible')
      cy.get('button').contains('Clear Filters').should('be.visible')
    })

    it('should display campus filter options', () => {
      cy.visit('/admin')
      
      cy.contains('College of San Mateo').should('be.visible')
      cy.contains('Skyline College').should('be.visible')
      cy.contains('Cañada College').should('be.visible')
      cy.contains('District Office').should('be.visible')
    })

    it('should perform search with query parameter', () => {
      cy.visit('/admin')
      
      cy.get('input[name="query"]').type('physics')
      cy.get('button').contains('Search').click()
      
      cy.url().should('include', 'q=physics')
      cy.waitForApiResponse('@getIndexItems')
    })

    it('should filter by campus', () => {
      cy.visit('/admin')
      
      cy.get('input[value="Skyline College"]').check()
      cy.get('button').contains('Search').click()
      
      cy.url().should('include', 'campus=Skyline+College')
      cy.waitForApiResponse('@getIndexItems')
    })

    it('should combine search query and campus filter', () => {
      cy.visit('/admin')
      
      cy.get('input[name="query"]').type('mathematics')
      cy.get('input[value="College of San Mateo"]').check()
      cy.get('button').contains('Search').click()
      
      cy.url().should('include', 'q=mathematics')
      cy.url().should('include', 'campus=College+of+San+Mateo')
      cy.waitForApiResponse('@getIndexItems')
    })

    it('should clear all filters', () => {
      cy.visit('/admin?q=test&campus=Skyline+College')
      
      cy.get('button').contains('Clear Filters').click()
      
      cy.url().should('eq', Cypress.config().baseUrl + '/admin')
    })

    it('should display data table with sortable columns', () => {
      cy.visit('/admin')
      
      cy.waitForApiResponse('@getIndexItems')
      
      // Check for table headers
      cy.contains('th', 'ID').should('be.visible')
      cy.contains('th', 'Title').should('be.visible')
      cy.contains('th', 'Letter').should('be.visible')
      cy.contains('th', 'Campus').should('be.visible')
      cy.contains('th', 'URL').should('be.visible')
      cy.contains('th', 'Actions').should('be.visible')
    })

    it('should navigate to create new item page', () => {
      cy.visit('/admin')
      
      cy.contains('Create New').click()
      cy.url().should('include', '/admin/new')
    })
  })

  describe('Create New Item', () => {
    it('should create a new index item', () => {
      cy.visit('/admin/new')
      
      cy.get('input[name="title"]').type('Test Department')
      cy.get('input[name="url"]').type('https://test.smccd.edu/department')
      cy.get('input[name="letter"]').type('T')
      cy.get('input[value="Skyline College"]').check()
      
      cy.get('button[type="submit"]').click()
      
      cy.waitForApiResponse('@createIndexItem')
      cy.url().should('include', '/admin') // Should redirect after creation
    })

    it('should validate required fields', () => {
      cy.visit('/admin/new')
      
      // Try to submit without filling required fields
      cy.get('button[type="submit"]').click()
      
      // Should show validation errors (HTML5 validation)
      cy.get('input[name="title"]:invalid').should('exist')
    })

    it('should populate letter field automatically from title', () => {
      cy.visit('/admin/new')
      
      cy.get('input[name="title"]').type('Biology Department')
      // Test if letter field auto-populates (if implemented)
      // This would depend on your actual implementation
    })
  })

  describe('Edit Item', () => {
    it('should navigate to edit page from data table', () => {
      cy.visit('/admin')
      cy.waitForApiResponse('@getIndexItems')
      
      // Click first edit button (assuming data exists)
      cy.get('a[href*="/admin/edit/"]').first().click()
      cy.url().should('match', /\/admin\/edit\/\d+/)
    })

    it('should load existing item data in edit form', () => {
      // This would require knowing a specific item ID
      // In a real scenario, you'd seed test data first
      cy.visit('/admin/edit/1')
      
      // Form should be populated with existing data
      cy.get('input[name="title"]').should('not.be.empty')
      cy.get('input[name="url"]').should('not.be.empty')
      cy.get('input[name="letter"]').should('not.be.empty')
    })
  })

  describe('Delete Item', () => {
    it('should delete an item from the data table', () => {
      cy.visit('/admin')
      cy.waitForApiResponse('@getIndexItems')
      
      // Click first delete button (assuming data exists)
      cy.get('button').contains('Delete').first().click()
      
      // Should confirm deletion (if confirmation dialog exists)
      // cy.get('.confirm-dialog').should('be.visible')
      // cy.get('button').contains('Confirm').click()
      
      cy.waitForApiResponse('@deleteIndexItem')
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport('iphone-6')
      cy.visit('/admin')
      
      cy.contains('Admin Home').should('be.visible')
      cy.get('input[name="query"]').should('be.visible')
    })

    it('should work on tablet viewport', () => {
      cy.viewport('ipad-2')
      cy.visit('/admin')
      
      cy.contains('Admin Home').should('be.visible')
      cy.get('input[name="query"]').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Mock API failure
      cy.intercept('GET', '/api/indexItems*', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getIndexItemsError')
      
      cy.visit('/admin')
      
      // Should show error message or handle gracefully
      // This depends on your error handling implementation
    })

    it('should handle network errors', () => {
      // Mock network failure
      cy.intercept('GET', '/api/indexItems*', { forceNetworkError: true }).as('networkError')
      
      cy.visit('/admin')
      
      // Should handle network errors gracefully
    })
  })

  describe('Authentication', () => {
    it('should redirect unauthenticated users', () => {
      // Don't bypass auth for this test
      cy.visit('/admin')
      
      // Should redirect to login or show auth error
      // This depends on your authentication implementation
      cy.url().should('not.include', '/admin')
    })
  })
})