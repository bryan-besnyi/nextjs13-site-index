'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AccessibilityConfig, DEFAULT_ACCESSIBILITY_CONFIG } from '@/lib/accessibility';

interface AccessibilityContextType extends AccessibilityConfig {
  updateConfig: (updates: Partial<AccessibilityConfig>) => void;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
  config?: Partial<AccessibilityConfig>;
}

export function AccessibilityProvider({ children, config = {} }: AccessibilityProviderProps) {
  const [accessibilityConfig, setAccessibilityConfig] = useState<AccessibilityConfig>({
    ...DEFAULT_ACCESSIBILITY_CONFIG,
    ...config
  });

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  // Detect user preferences
  useEffect(() => {
    // Reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(reducedMotionQuery.matches);
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      setAccessibilityConfig(prev => ({ ...prev, reduceMotion: e.matches }));
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // High contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(highContrastQuery.matches);
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
      setAccessibilityConfig(prev => ({ ...prev, highContrastMode: e.matches }));
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  // Apply accessibility CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    // Set CSS custom properties for accessibility
    root.style.setProperty('--a11y-reduce-motion', prefersReducedMotion ? '1' : '0');
    root.style.setProperty('--a11y-high-contrast', prefersHighContrast ? '1' : '0');
    
    // Add accessibility classes to body
    document.body.classList.toggle('reduce-motion', prefersReducedMotion);
    document.body.classList.toggle('high-contrast', prefersHighContrast);
    
    return () => {
      document.body.classList.remove('reduce-motion', 'high-contrast');
    };
  }, [prefersReducedMotion, prefersHighContrast]);

  const updateConfig = (updates: Partial<AccessibilityConfig>) => {
    setAccessibilityConfig(prev => ({ ...prev, ...updates }));
  };

  const contextValue: AccessibilityContextType = {
    ...accessibilityConfig,
    updateConfig,
    prefersReducedMotion,
    prefersHighContrast
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* Live region for announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="a11y-announcer-polite"
      />
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id="a11y-announcer-assertive"
      />
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Skip Links Component
interface SkipLink {
  href: string;
  label: string;
}

interface SkipLinksProps {
  links: SkipLink[];
}

export function SkipLinks({ links }: SkipLinksProps) {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <nav aria-label="Skip navigation links" className="absolute top-0 left-0 z-[9999]">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="block bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 focus:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

// Screen Reader Only Text Component
interface ScreenReaderOnlyProps {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export function ScreenReaderOnly({ children, as: Component = 'span' }: ScreenReaderOnlyProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}

// Focus Indicator Component
export function FocusIndicator() {
  return (
    <style jsx global>{`
      /* Enhanced focus indicators for better visibility */
      *:focus {
        outline: 2px solid #2563eb;
        outline-offset: 2px;
        border-radius: 2px;
      }

      /* High contrast mode adjustments */
      @media (prefers-contrast: high) {
        *:focus {
          outline: 3px solid;
          outline-offset: 2px;
        }
      }

      /* Reduced motion preferences */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }

      /* Better focus for interactive elements */
      button:focus,
      [role="button"]:focus,
      input:focus,
      select:focus,
      textarea:focus,
      a:focus,
      [tabindex]:focus {
        outline: 2px solid #2563eb;
        outline-offset: 2px;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
      }

      /* Focus within for containers */
      .focus-within-highlight:focus-within {
        outline: 2px solid #2563eb;
        outline-offset: 2px;
      }
    `}</style>
  );
}

// Component for accessibility testing (development only)
export function AccessibilityDebugPanel() {
  const { updateConfig, ...config } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
        aria-expanded={isOpen}
        aria-controls="a11y-debug-panel"
      >
        A11y Debug
      </button>
      
      {isOpen && (
        <div
          id="a11y-debug-panel"
          className="absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80"
          role="dialog"
          aria-label="Accessibility Debug Panel"
        >
          <h3 className="text-lg font-semibold mb-3">Accessibility Settings</h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.skipLinksEnabled}
                onChange={(e) => updateConfig({ skipLinksEnabled: e.target.checked })}
                className="mr-2"
              />
              Skip Links Enabled
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.focusVisibilityEnabled}
                onChange={(e) => updateConfig({ focusVisibilityEnabled: e.target.checked })}
                className="mr-2"
              />
              Enhanced Focus Visibility
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.announcePageChanges}
                onChange={(e) => updateConfig({ announcePageChanges: e.target.checked })}
                className="mr-2"
              />
              Announce Page Changes
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.highContrastMode}
                onChange={(e) => updateConfig({ highContrastMode: e.target.checked })}
                className="mr-2"
              />
              High Contrast Mode
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.reduceMotion}
                onChange={(e) => updateConfig({ reduceMotion: e.target.checked })}
                className="mr-2"
              />
              Reduce Motion
            </label>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 w-full bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}