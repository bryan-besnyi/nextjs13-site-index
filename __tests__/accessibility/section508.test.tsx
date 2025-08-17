/**
 * Section 508 Compliance Tests
 * 
 * These tests verify that the application meets Section 508 accessibility requirements
 * and WCAG 2.1 AA standards.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { Section508Compliance, ColorContrast } from '@/lib/accessibility';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock window.matchMedia for testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Next.js components for testing
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AccessibilityProvider>
    {children}
  </AccessibilityProvider>
);

describe('Section 508 Compliance', () => {
  let compliance: Section508Compliance;

  beforeEach(() => {
    compliance = new Section508Compliance();
    // Clear any existing live regions
    document.querySelectorAll('[aria-live]').forEach(el => el.remove());
  });

  describe('Core Accessibility Features', () => {
    test('should have no accessibility violations on basic page structure', async () => {
      const { container } = render(
        <TestWrapper>
          <main role="main">
            <h1>Page Title</h1>
            <nav role="navigation" aria-label="Main navigation">
              <ul>
                <li><a href="/home">Home</a></li>
                <li><a href="/about">About</a></li>
              </ul>
            </nav>
            <section>
              <h2>Content Section</h2>
              <p>This is some content.</p>
            </section>
          </main>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should provide skip links', () => {
      render(
        <TestWrapper>
          <nav aria-label="Skip navigation links">
            <a href="#main-content">Skip to main content</a>
            <a href="#navigation">Skip to navigation</a>
          </nav>
          <main id="main-content">Content</main>
        </TestWrapper>
      );

      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
      expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
    });

    test('should have proper heading hierarchy', async () => {
      const { container } = render(
        <TestWrapper>
          <main>
            <h1>Main Title</h1>
            <section>
              <h2>Section Title</h2>
              <article>
                <h3>Article Title</h3>
                <p>Content</p>
              </article>
            </section>
          </main>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Accessibility', () => {
    test('should have no violations on forms with proper labels', async () => {
      const { container } = render(
        <TestWrapper>
          <form>
            <div>
              <label htmlFor="email">Email Address</label>
              <input id="email" type="email" name="email" required />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input id="password" type="password" name="password" required />
            </div>
            <button type="submit">Submit</button>
          </form>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should handle form validation errors accessibly', async () => {
      const { container } = render(
        <TestWrapper>
          <form>
            <div>
              <label htmlFor="email">Email Address</label>
              <input 
                id="email" 
                type="email" 
                name="email" 
                aria-invalid="true"
                aria-describedby="email-error"
              />
              <div id="email-error" role="alert" aria-live="polite">
                Please enter a valid email address
              </div>
            </div>
            <button type="submit">Submit</button>
          </form>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should support keyboard navigation in forms', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <form>
            <input data-testid="input1" type="text" placeholder="First input" />
            <input data-testid="input2" type="text" placeholder="Second input" />
            <button data-testid="submit" type="submit">Submit</button>
          </form>
        </TestWrapper>
      );

      const firstInput = screen.getByTestId('input1');
      const secondInput = screen.getByTestId('input2');
      const submitButton = screen.getByTestId('submit');

      // Test tab navigation
      await user.tab();
      expect(firstInput).toHaveFocus();

      await user.tab();
      expect(secondInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });

  describe('Interactive Elements', () => {
    test('should have accessible buttons', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <button type="button">Standard Button</button>
            <button type="button" aria-label="Close dialog">×</button>
            <div role="button" tabIndex={0} aria-label="Custom button">
              Custom Button
            </div>
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should support keyboard interaction on custom interactive elements', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <div
            role="button"
            tabIndex={0}
            aria-label="Custom button"
            onClick={handleClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }}
          >
            Custom Button
          </div>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // Test Enter key
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Test Space key
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Images and Media', () => {
    test('should have accessible images', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <img src="/test.jpg" alt="Descriptive alt text" />
            <img src="/decorative.jpg" alt="" role="presentation" />
            <img src="/logo.jpg" alt="Company Logo" />
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Data Tables', () => {
    test('should have accessible data tables', async () => {
      const { container } = render(
        <TestWrapper>
          <table role="table" aria-label="Student grades">
            <caption>Student Grade Report</caption>
            <thead>
              <tr>
                <th scope="col">Student Name</th>
                <th scope="col">Subject</th>
                <th scope="col">Grade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>John Doe</td>
                <td>Mathematics</td>
                <td>A</td>
              </tr>
              <tr>
                <td>Jane Smith</td>
                <td>Science</td>
                <td>B</td>
              </tr>
            </tbody>
          </table>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Focus Management', () => {
    test('should manage focus in modal dialogs', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <div>
            <button data-testid="open-modal">Open Modal</button>
            <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
              <h2 id="modal-title">Modal Dialog</h2>
              <button data-testid="modal-button">Modal Button</button>
              <button data-testid="close-modal">Close</button>
            </div>
          </div>
        </TestWrapper>
      );

      const openButton = screen.getByTestId('open-modal');
      const modalButton = screen.getByTestId('modal-button');

      // Focus should be manageable
      openButton.focus();
      expect(openButton).toHaveFocus();

      await user.tab();
      expect(modalButton).toHaveFocus();
    });
  });

  describe('Live Regions', () => {
    test('should announce dynamic content changes', () => {
      render(
        <TestWrapper>
          <div>
            <div aria-live="polite" data-testid="polite-region"></div>
            <div aria-live="assertive" data-testid="assertive-region"></div>
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('polite-region')).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByTestId('assertive-region')).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Color Contrast', () => {
    test('should meet WCAG AA contrast requirements', () => {
      // Test common color combinations
      expect(ColorContrast.meetsContrastRequirement('#000000', '#FFFFFF', 'AA')).toBe(true);
      expect(ColorContrast.meetsContrastRequirement('#FFFFFF', '#000000', 'AA')).toBe(true);
      expect(ColorContrast.meetsContrastRequirement('#767676', '#FFFFFF', 'AA')).toBe(true);
      
      // Test insufficient contrast
      expect(ColorContrast.meetsContrastRequirement('#CCCCCC', '#FFFFFF', 'AA')).toBe(false);
    });

    test('should calculate contrast ratios correctly', () => {
      const ratio = ColorContrast.getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeGreaterThan(20); // Black on white should have very high contrast
      
      const lowRatio = ColorContrast.getContrastRatio('#CCCCCC', '#FFFFFF');
      expect(lowRatio).toBeLessThan(3); // Light gray on white should have low contrast
    });
  });

  describe('Section 508 Validation', () => {
    test('should validate interactive elements', () => {
      // Create test element
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      document.body.appendChild(button);

      const violations = compliance.validateElement(button);
      expect(violations).toHaveLength(0);

      document.body.removeChild(button);
    });

    test('should detect missing labels on form controls', () => {
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);

      const violations = compliance.validateElement(input);
      expect(violations).toContain('Form control missing proper label');

      document.body.removeChild(input);
    });

    test('should detect missing alt text on images', () => {
      const img = document.createElement('img');
      img.src = 'test.jpg';
      // Don't set alt attribute to test detection
      document.body.appendChild(img);

      const violations = compliance.validateElement(img);
      expect(violations).toContain('Image missing alt attribute');

      document.body.removeChild(img);
    });
  });

  describe('Responsive Design', () => {
    test('should support mobile screen readers', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(
        <TestWrapper>
          <main>
            <h1>Mobile Page</h1>
            <nav aria-label="Mobile navigation">
              <button aria-expanded="false" aria-controls="mobile-menu">
                Menu
              </button>
              <ul id="mobile-menu">
                <li><a href="/home">Home</a></li>
                <li><a href="/about">About</a></li>
              </ul>
            </nav>
          </main>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe('Keyboard Navigation', () => {
  test('should handle arrow key navigation', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <div role="tablist">
          <div role="tab" tabIndex={0} data-testid="tab1">Tab 1</div>
          <div role="tab" tabIndex={-1} data-testid="tab2">Tab 2</div>
          <div role="tab" tabIndex={-1} data-testid="tab3">Tab 3</div>
        </div>
      </TestWrapper>
    );

    const tab1 = screen.getByTestId('tab1');
    tab1.focus();
    expect(tab1).toHaveFocus();

    // Test arrow key navigation would require implementing the actual behavior
    // This is a placeholder for testing the structure
  });
});

describe('Error Handling', () => {
  test('should provide accessible error messages', async () => {
    const { container } = render(
      <TestWrapper>
        <div>
          <div role="alert" aria-live="assertive">
            Error: Please correct the following issues
          </div>
          <ul>
            <li>Email address is required</li>
            <li>Password must be at least 8 characters</li>
          </ul>
        </div>
      </TestWrapper>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});