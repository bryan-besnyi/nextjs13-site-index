import { useEffect, useState } from 'react';

export function useCSRF() {
  const [csrfToken, setCSRFToken] = useState<string>('');

  useEffect(() => {
    // In production, this would fetch a CSRF token from the server
    // For now, we generate a client-side token
    const token = typeof window !== 'undefined' 
      ? window.crypto.getRandomValues(new Uint8Array(16)).join('')
      : '';
    
    setCSRFToken(token);
    
    // Store in session storage for consistency across requests
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('csrf-token', token);
    }
  }, []);

  // Helper function to add CSRF token to fetch requests
  const fetchWithCSRF = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    headers.set('X-CSRF-Token', csrfToken);

    return fetch(url, {
      ...options,
      headers
    });
  };

  return { csrfToken, fetchWithCSRF };
}