/**
 * React hooks for accessibility features
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { KeyboardNavigation } from '@/lib/accessibility';

/**
 * Hook for managing focus trapping in modals and dropdowns
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const cleanup = KeyboardNavigation.trapFocus(containerRef.current);
    
    return cleanup;
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for announcing content changes to screen readers
 */
export function useScreenReader() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    KeyboardNavigation.announceToScreenReader(message, priority);
  }, []);

  return { announce };
}

/**
 * Hook for managing roving tabindex in component groups
 */
export function useRovingTabIndex(selector: string) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    KeyboardNavigation.setupRovingTabindex(containerRef.current, selector);
  }, [selector]);

  return containerRef;
}

/**
 * Hook for detecting user preferences for reduced motion
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for detecting user preferences for high contrast
 */
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
}

/**
 * Hook for managing skip links
 */
export function useSkipLinks(links: Array<{ href: string; label: string }>) {
  const [isVisible, setIsVisible] = useState(false);

  const showSkipLinks = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideSkipLinks = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    showSkipLinks,
    hideSkipLinks,
    links
  };
}

/**
 * Hook for keyboard navigation handling
 */
export function useKeyboardNavigation() {
  const handleKeyDown = useCallback((e: KeyboardEvent, callbacks: {
    onEnter?: () => void;
    onSpace?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onEscape?: () => void;
    onTab?: (shiftKey: boolean) => void;
  }) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        callbacks.onEnter?.();
        break;
      case ' ':
      case 'Space':
        e.preventDefault();
        callbacks.onSpace?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        callbacks.onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        callbacks.onArrowDown?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        callbacks.onArrowLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        callbacks.onArrowRight?.();
        break;
      case 'Escape':
        e.preventDefault();
        callbacks.onEscape?.();
        break;
      case 'Tab':
        callbacks.onTab?.(e.shiftKey);
        break;
    }
  }, []);

  return { handleKeyDown };
}

/**
 * Hook for managing live regions
 */
export function useLiveRegion() {
  const [liveContent, setLiveContent] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announce = useCallback((content: string, urgency: 'polite' | 'assertive' = 'polite') => {
    setPriority(urgency);
    setLiveContent(content);
    
    // Clear after announcement
    setTimeout(() => {
      setLiveContent('');
    }, 100);
  }, []);

  return {
    liveContent,
    priority,
    announce
  };
}

/**
 * Hook for form accessibility
 */
export function useFormAccessibility() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { announce } = useScreenReader();

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    
    // Announce error to screen reader
    if (error) {
      announce(`Error in ${fieldName}: ${error}`, 'assertive');
    }
  }, [announce]);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const getFieldProps = useCallback((fieldName: string) => {
    const hasError = !!errors[fieldName];
    
    return {
      'aria-invalid': hasError,
      'aria-describedby': hasError ? `${fieldName}-error` : undefined,
    };
  }, [errors]);

  const getErrorProps = useCallback((fieldName: string) => {
    return {
      id: `${fieldName}-error`,
      role: 'alert',
      'aria-live': 'polite' as const,
    };
  }, []);

  return {
    errors,
    setFieldError,
    clearFieldError,
    getFieldProps,
    getErrorProps
  };
}