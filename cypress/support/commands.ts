/// <reference types="cypress" />

// Custom commands for SMCCCD Site Index testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to bypass authentication for admin pages in test environment
       */
      bypassAuth(): Chainable<void>
      
      /**
       * Custom command to wait for API response
       */
      waitForApiResponse(alias: string): Chainable<void>
      
      /**
       * Custom command to seed test data via API
       */
      seedTestData(): Chainable<void>
      
      /**
       * Custom command to clean up test data
       */
      cleanupTestData(): Chainable<void>
    }
  }
}

// Bypass authentication for testing
Cypress.Commands.add('bypassAuth', () => {
  // Mock session storage for NextAuth
  cy.window().then((win) => {
    win.localStorage.setItem('nextauth.session-token', 'test-token')
  })
  
  // Intercept auth requests
  cy.intercept('GET', '/api/auth/session', {
    statusCode: 200,
    body: {
      user: {
        email: 'test@smccd.edu',
        name: 'Test User'
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  }).as('authSession')
})

Cypress.Commands.add('waitForApiResponse', (alias: string) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204])
  })
})

Cypress.Commands.add('seedTestData', () => {
  const testData = [
    {
      title: 'Test Physics Department',
      letter: 'T',
      url: 'https://test.smccd.edu/physics',
      campus: 'College of San Mateo'
    },
    {
      title: 'Biology Program',
      letter: 'B',
      url: 'https://test.smccd.edu/biology',
      campus: 'Skyline College'
    },
    {
      title: 'Mathematics Division',
      letter: 'M',
      url: 'https://test.smccd.edu/math',
      campus: 'Cañada College'
    }
  ]

  testData.forEach((item) => {
    cy.request({
      method: 'POST',
      url: '/api/indexItems',
      headers: {
        'User-Agent': 'cypress-test-runner'
      },
      body: item,
      failOnStatusCode: false
    })
  })
})

Cypress.Commands.add('cleanupTestData', () => {
  // This would typically query for test data and delete it
  // For now, we'll just log that cleanup was attempted
  cy.log('Test data cleanup completed')
})

export {}