describe('SMCCCD Site Index - Realistic User Journeys', () => {
  beforeEach(() => {
    // Mock authentication for admin routes
    cy.window().then((win) => {
      win.localStorage.setItem('nextauth.session-token', 'mock-session-token');
    });
  });

  it('Journey 1: Skyline web dev bulk imports 10 new student services links', () => {
    cy.visit('/admin');
    
    // Quick dashboard check - dev is in hurry
    cy.contains('Skyline College').should('be.visible');
    
    // Navigate to bulk add (assumes this exists)
    cy.get('[data-testid="bulk-add-btn"]').click();
    
    // Bulk import scenario - common for new semester
    const newResources = [
      'Student Financial Services',
      'Academic Success Center', 
      'Transfer Center',
      'Career Services Center',
      'Disability Resource Center',
      'International Student Services',
      'Veterans Services',
      'Student Life & Leadership',
      'Learning Communities',
      'Promise Scholars Program'
    ];
    
    newResources.forEach((resource, index) => {
      cy.get('[data-testid="add-new-item"]').click();
      cy.get('input[name="title"]').type(resource);
      cy.get('input[name="url"]').type(`https://skylinecollege.edu/services/${resource.toLowerCase().replace(/\s+/g, '-')}`);
      cy.get('input[name="letter"]').type(resource.charAt(0));
      cy.get('input[value="Skyline College"]').check();
      cy.get('[name="addAndContinue"]').click();
      
      // Verify success message appears
      cy.contains('successfully').should('be.visible');
    });
    
    // Verify all items were added
    cy.visit('/letter/S');
    cy.contains('Student Financial Services').should('be.visible');
    cy.contains('Student Life & Leadership').should('be.visible');
  });

  it('Journey 2: CSM dev has 5 mins, never logged in, needs quick faculty directory link', () => {
    // Simulate first-time user experience
    cy.visit('/');
    
    // Quick search without login - public API access
    cy.get('[data-testid="search-input"]', { timeout: 3000 }).type('faculty directory');
    cy.get('[data-testid="search-submit"]').click();
    
    // Should find existing faculty resources
    cy.contains('College of San Mateo', { timeout: 5000 }).should('be.visible');
    
    // Realizes they need to add new one - quick login flow
    cy.get('[data-testid="admin-login"]').click();
    
    // OneLogin simulation (would be actual SSO in production)
    cy.url().should('include', '/auth/signin');
    cy.get('[data-testid="onelogin-btn"]').click();
    
    // Back to admin after auth
    cy.url().should('include', '/admin');
    
    // Quick add - time pressured workflow
    cy.get('[data-testid="quick-add"]').click();
    cy.get('input[name="title"]').type('Faculty Directory - CSM');
    cy.get('input[name="url"]').type('https://collegeofsanmateo.edu/directory/faculty');
    cy.get('input[name="letter"]').type('F');
    cy.get('input[value="College of San Mateo"]').check();
    cy.get('[name="addAndFinish"]').click();
    
    // Success and immediate exit
    cy.contains('successfully').should('be.visible');
    cy.url().should('include', '/admin');
  });

  it('Journey 3: Canada College dev debugging broken links during semester start', () => {
    cy.visit('/admin');
    
    // Navigate to Canada College section
    cy.get('[data-testid="campus-filter"]').select('Cañada College');
    
    // Look for broken/outdated links - common issue
    cy.contains('Cañada College').should('be.visible');
    cy.get('[data-testid="item-row"]').should('have.length.at.least', 3);
    
    // Simulate finding broken link
    cy.get('[data-testid="item-row"]').first().within(() => {
      cy.get('[data-testid="test-link-btn"]').click();
    });
    
    // Link checker would show 404 - need to update
    cy.get('[data-testid="edit-btn"]').first().click();
    
    // Quick URL update
    cy.get('input[name="url"]').clear().type('https://canadacollege.edu/updated-admissions');
    cy.get('[data-testid="save-changes"]').click();
    
    // Verify update
    cy.contains('updated successfully').should('be.visible');
  });

  it('Journey 4: District Office dev needs comprehensive admin services audit', () => {
    cy.visit('/admin');
    
    // Check district-wide resources
    cy.get('[data-testid="campus-filter"]').select('District Office');
    
    // Export current list for audit
    cy.get('[data-testid="export-csv"]').click();
    cy.readFile('cypress/downloads/district-office-resources.csv').should('exist');
    
    // Review analytics for usage patterns
    cy.get('[data-testid="analytics-tab"]').click();
    cy.contains('Usage Statistics').should('be.visible');
    cy.get('[data-testid="popular-resources"]').should('be.visible');
    
    // Identify gaps - add missing HR resources
    cy.get('[data-testid="add-resource"]').click();
    cy.get('input[name="title"]').type('Human Resources Portal');
    cy.get('input[name="url"]').type('https://smccd.edu/hr/portal');
    cy.get('input[name="letter"]').type('H');
    cy.get('input[value="District Office"]').check();
    cy.get('[name="addAndFinish"]').click();
  });

  it('Journey 5: Multi-campus dev coordinating resource consistency across sites', () => {
    cy.visit('/admin');
    
    // Check resource consistency across campuses
    const campuses = ['College of San Mateo', 'Skyline College', 'Cañada College'];
    
    campuses.forEach(campus => {
      cy.get('[data-testid="campus-filter"]').select(campus);
      cy.get('[data-testid="letter-A"]').click();
      
      // Verify each campus has basic A-resources
      cy.contains('Admissions').should('be.visible');
      cy.contains(campus).should('be.visible');
    });
    
    // Add missing resource to maintain consistency
    cy.get('[data-testid="campus-filter"]').select('Cañada College');
    cy.get('[data-testid="add-resource"]').click();
    cy.get('input[name="title"]').type('Academic Calendar');
    cy.get('input[name="url"]').type('https://canadacollege.edu/calendar/academic');
    cy.get('input[name="letter"]').type('A');
    cy.get('input[value="Cañada College"]').check();
    cy.get('[name="addAndFinish"]').click();
  });

  it('Journey 6: Emergency update - critical service URL changed overnight', () => {
    cy.visit('/admin');
    
    // Urgent search for specific service
    cy.get('[data-testid="admin-search"]').type('Emergency Services');
    cy.get('[data-testid="search-submit"]').click();
    
    // Find and quickly update
    cy.get('[data-testid="edit-btn"]').first().click();
    cy.get('input[name="url"]').clear().type('https://smccd.edu/emergency-new-portal');
    cy.get('[data-testid="save-changes"]').click();
    
    // Verify across all campuses
    cy.contains('updated successfully').should('be.visible');
    
    // Quick verification
    cy.visit('/letter/E');
    cy.contains('Emergency Services').should('be.visible');
  });

  it('Journey 7: New semester prep - batch updates for registration dates', () => {
    cy.visit('/admin');
    
    // Filter for registration-related resources
    cy.get('[data-testid="admin-search"]').type('registration');
    cy.get('[data-testid="search-submit"]').click();
    
    // Bulk update scenario - common for semester changes
    cy.get('[data-testid="item-row"]').each(($el) => {
      cy.wrap($el).within(() => {
        cy.get('[data-testid="edit-btn"]').click();
        cy.get('input[name="url"]').invoke('val').then((currentUrl) => {
          // Add semester parameter to URL
          cy.get('input[name="url"]').clear().type(`${currentUrl}?semester=spring2024`);
        });
        cy.get('[data-testid="save-changes"]').click();
        cy.contains('updated').should('be.visible');
      });
    });
  });

  it('Journey 8: Weekend maintenance - system health check and cache clearing', () => {
    cy.visit('/admin');
    
    // Check system health
    cy.get('[data-testid="system-health"]').click();
    cy.contains('Database').should('be.visible');
    cy.contains('healthy').should('be.visible');
    
    // Performance check
    cy.get('[data-testid="performance-tab"]').click();
    cy.contains('Response Time').should('be.visible');
    cy.get('[data-testid="avg-response-time"]').should('contain', 'ms');
    
    // Clear cache for fresh start
    cy.get('[data-testid="cache-tab"]').click();
    cy.get('[data-testid="clear-all-cache"]').click();
    cy.get('[data-testid="confirm-clear"]').click();
    cy.contains('Cache cleared').should('be.visible');
    
    // Verify backup system
    cy.get('[data-testid="backups-tab"]').click();
    cy.get('[data-testid="create-backup"]').click();
    cy.contains('Backup created').should('be.visible');
  });

  it('Journey 9: Public user workflow - student trying to find financial aid quickly', () => {
    // Public access - no login required
    cy.visit('/');
    
    // Quick search for common student need
    cy.get('[data-testid="search-input"]').type('financial aid');
    cy.get('[data-testid="search-submit"]').click();
    
    // Should show results from all campuses
    cy.contains('Financial Aid').should('be.visible');
    cy.get('[data-testid="result-item"]').should('have.length.at.least', 3);
    
    // Campus-specific search
    cy.get('[data-testid="campus-filter-public"]').select('Skyline College');
    cy.get('[data-testid="search-submit"]').click();
    
    // Should filter to Skyline only
    cy.contains('Skyline College').should('be.visible');
    
    // Letter-based navigation
    cy.get('[data-testid="letter-F"]').click();
    cy.contains('Financial Aid').should('be.visible');
    
    // External link should work
    cy.get('[data-testid="external-link"]').first().should('have.attr', 'href').and('include', 'https://');
  });

  it('Journey 10: Performance crisis - site slowdown during registration week', () => {
    cy.visit('/admin');
    
    // Check performance metrics during high load
    cy.get('[data-testid="performance-tab"]').click();
    
    // Monitor real-time metrics
    cy.get('[data-testid="current-load"]').should('be.visible');
    cy.get('[data-testid="response-times"]').should('be.visible');
    
    // Check error rates
    cy.get('[data-testid="error-rate"]').should('contain', '%');
    
    // Cache hit rate should be high during load
    cy.get('[data-testid="cache-hit-rate"]').should('be.visible');
    
    // If performance is poor, clear problematic cache
    cy.get('[data-testid="cache-tab"]').click();
    cy.get('[data-testid="cache-keys"]').should('have.length.at.least', 5);
    
    // Selective cache clearing
    cy.contains('items-letter-').first().within(() => {
      cy.get('[data-testid="delete-cache-key"]').click();
    });
    
    // Force cache refresh
    cy.get('[data-testid="refresh-cache"]').click();
    cy.contains('refreshed').should('be.visible');
    
    // Verify improved performance
    cy.get('[data-testid="performance-tab"]').click();
    cy.get('[data-testid="avg-response-time"]').should('be.visible');
  });
});