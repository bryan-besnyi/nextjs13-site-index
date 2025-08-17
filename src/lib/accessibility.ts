/**
 * Section 508 Compliance Utilities
 * 
 * This module provides utilities for ensuring Section 508 compliance
 * across the application, including WCAG 2.1 AA requirements.
 */

export interface AccessibilityConfig {
  // Focus management
  skipLinksEnabled: boolean;
  focusVisibilityEnabled: boolean;
  focusTrapEnabled: boolean;
  
  // Screen reader support
  announcePageChanges: boolean;
  ariaLabelsRequired: boolean;
  
  // Keyboard navigation
  keyboardNavigationEnabled: boolean;
  tabIndexManagement: boolean;
  
  // Visual accessibility
  highContrastMode: boolean;
  reduceMotion: boolean;
  fontSizeAdjustment: boolean;
  
  // Color and contrast
  colorContrastCompliance: boolean;
  colorAlternatives: boolean;
}

export const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  skipLinksEnabled: true,
  focusVisibilityEnabled: true,
  focusTrapEnabled: true,
  announcePageChanges: true,
  ariaLabelsRequired: true,
  keyboardNavigationEnabled: true,
  tabIndexManagement: true,
  highContrastMode: false,
  reduceMotion: false,
  fontSizeAdjustment: false,
  colorContrastCompliance: true,
  colorAlternatives: true,
};

/**
 * Section 508 compliance checker
 */
export class Section508Compliance {
  private config: AccessibilityConfig;

  constructor(config: AccessibilityConfig = DEFAULT_ACCESSIBILITY_CONFIG) {
    this.config = config;
  }

  /**
   * Validate that an element meets Section 508 requirements
   */
  validateElement(element: HTMLElement): string[] {
    const violations: string[] = [];

    // Check for required ARIA labels
    if (this.config.ariaLabelsRequired) {
      if (this.isInteractiveElement(element) && !this.hasAccessibleName(element)) {
        violations.push('Interactive element missing accessible name');
      }
    }

    // Check for proper heading hierarchy
    if (element.tagName.match(/^H[1-6]$/)) {
      const level = parseInt(element.tagName.charAt(1));
      if (!this.isProperHeadingLevel(element, level)) {
        violations.push('Improper heading hierarchy');
      }
    }

    // Check for image alt text
    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement;
      if (!img.hasAttribute('alt')) {
        violations.push('Image missing alt attribute');
      }
    }

    // Check for form labels
    if (this.isFormControl(element)) {
      if (!this.hasProperLabel(element)) {
        violations.push('Form control missing proper label');
      }
    }

    return violations;
  }

  /**
   * Check if element is interactive
   */
  private isInteractiveElement(element: HTMLElement): boolean {
    const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    const interactiveRoles = ['button', 'link', 'tab', 'menuitem', 'checkbox', 'radio'];
    
    return interactiveTags.includes(element.tagName) ||
           interactiveRoles.includes(element.getAttribute('role') || '') ||
           element.hasAttribute('onclick') ||
           element.tabIndex >= 0;
  }

  /**
   * Check if element has accessible name
   */
  private hasAccessibleName(element: HTMLElement): boolean {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('title') ||
      element.textContent?.trim()
    );
  }

  /**
   * Check heading level hierarchy
   */
  private isProperHeadingLevel(element: HTMLElement, level: number): boolean {
    // This is a simplified check - in practice, you'd track the heading hierarchy
    // throughout the page to ensure proper nesting
    return level >= 1 && level <= 6;
  }

  /**
   * Check if element is a form control
   */
  private isFormControl(element: HTMLElement): boolean {
    const formTags = ['INPUT', 'SELECT', 'TEXTAREA'];
    return formTags.includes(element.tagName);
  }

  /**
   * Check if form control has proper label
   */
  private hasProperLabel(element: HTMLElement): boolean {
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return true;
    }

    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.closest('label')
    );
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  /**
   * Handle focus trapping within a container
   */
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }

      if (e.key === 'Escape') {
        // Allow escape to exit focus trap
        const event = new CustomEvent('escape-focus-trap');
        container.dispatchEvent(event);
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus the first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Announce content to screen readers
   */
  static announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  /**
   * Handle roving tabindex for radio groups and similar components
   */
  static setupRovingTabindex(container: HTMLElement, selector: string): void {
    const items = container.querySelectorAll(selector) as NodeListOf<HTMLElement>;
    if (items.length === 0) return;

    // Set initial state
    items[0].tabIndex = 0;
    for (let i = 1; i < items.length; i++) {
      items[i].tabIndex = -1;
    }

    container.addEventListener('keydown', (e) => {
      const currentIndex = Array.from(items).indexOf(e.target as HTMLElement);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = (currentIndex + 1) % items.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = (currentIndex - 1 + items.length) % items.length;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
        default:
          return;
      }

      // Update tabindex and focus
      items[currentIndex].tabIndex = -1;
      items[nextIndex].tabIndex = 0;
      items[nextIndex].focus();
    });
  }
}

/**
 * Color contrast utilities
 */
export class ColorContrast {
  /**
   * Check if color combination meets WCAG contrast requirements
   */
  static meetsContrastRequirement(
    foreground: string, 
    background: string, 
    level: 'AA' | 'AAA' = 'AA',
    large: boolean = false
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    
    if (level === 'AAA') {
      return large ? ratio >= 4.5 : ratio >= 7;
    }
    
    return large ? ratio >= 3 : ratio >= 4.5;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get relative luminance of a color
   */
  private static getLuminance(color: string): number {
    // Simplified luminance calculation
    // In production, you'd want a more robust color parsing library
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      const normalized = c / 255;
      return normalized <= 0.03928 
        ? normalized / 12.92 
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

// Export instances for easy use
export const section508 = new Section508Compliance();