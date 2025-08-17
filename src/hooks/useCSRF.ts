import { useEffect, useState, useCallback } from 'react';
import { CSRF_CLIENT_CONFIG } from '@/lib/csrf';

interface CSRFHookReturn {
  csrfToken: string;
  isLoading: boolean;
  error: string | null;
  fetchWithCSRF: (url: string, options?: RequestInit) => Promise<Response>;
  refreshToken: () => Promise<void>;
}

export function useCSRF(): CSRFHookReturn {
  const [csrfToken, setCSRFToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No CSRF token received from server');
      }

      setCSRFToken(data.token);
      
      // Store in session storage for consistency across tabs
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('csrf-token', data.token);
        sessionStorage.setItem('csrf-token-timestamp', Date.now().toString());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching CSRF token';
      setError(errorMessage);
      console.error('CSRF token fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    await fetchToken();
  }, [fetchToken]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if we have a recent token in session storage
    const storedToken = sessionStorage.getItem('csrf-token');
    const storedTimestamp = sessionStorage.getItem('csrf-token-timestamp');
    
    // Token is valid for 1 hour, refresh if older
    const tokenAge = storedTimestamp ? Date.now() - parseInt(storedTimestamp) : Infinity;
    const oneHour = 60 * 60 * 1000;
    
    if (storedToken && tokenAge < oneHour) {
      setCSRFToken(storedToken);
      setIsLoading(false);
    } else {
      // Fetch new token
      fetchToken();
    }
  }, [fetchToken]);

  // Helper function to add CSRF token to fetch requests
  const fetchWithCSRF = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    // Ensure we have a token
    if (!csrfToken && !isLoading) {
      await fetchToken();
    }
    
    if (!csrfToken) {
      throw new Error('No CSRF token available');
    }

    const headers = new Headers(options.headers);
    headers.set(CSRF_CLIENT_CONFIG.headerName, csrfToken);
    
    // Ensure credentials are included for cookie-based auth
    const enhancedOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'same-origin',
    };

    try {
      const response = await fetch(url, enhancedOptions);
      
      // If we get a 403 with CSRF error, try refreshing the token once
      if (response.status === 403) {
        const responseText = await response.text();
        if (responseText.includes('CSRF') || response.headers.get('X-CSRF-Required')) {
          console.warn('CSRF token may be expired, refreshing...');
          await refreshToken();
          
          // Retry with new token
          if (csrfToken) {
            headers.set(CSRF_CLIENT_CONFIG.headerName, csrfToken);
            return fetch(url, { ...enhancedOptions, headers });
          }
        }
      }
      
      return response;
    } catch (fetchError) {
      console.error('Fetch with CSRF error:', fetchError);
      throw fetchError;
    }
  }, [csrfToken, isLoading, fetchToken, refreshToken]);

  return {
    csrfToken,
    isLoading,
    error,
    fetchWithCSRF,
    refreshToken,
  };
}