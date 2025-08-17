/**
 * Client-side CSRF Configuration
 * 
 * This module provides client-side CSRF configuration without server dependencies
 */

export const CSRF_CLIENT_CONFIG = {
  headerName: 'x-csrf-token',
  fieldName: 'csrfToken',
  cookieName: 'csrf-token',
};