'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// Check if we're in preview mode - this needs to be inside the component to work properly

const OneLoginSignInButton = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if we're in preview mode - client-side env vars need NEXT_PUBLIC_ prefix
  const isPreviewMode = typeof window !== 'undefined' && 
    (window.location.hostname.includes('vercel.app') || 
     process.env.NODE_ENV === 'development');

  // Check for authentication errors
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'Configuration':
          setError('Authentication service is misconfigured. Please contact your system administrator.');
          break;
        case 'AccessDenied':
          setError('Access denied. You do not have permission to access the admin area.');
          break;
        case 'Verification':
          setError('Unable to verify your identity. Please try again.');
          break;
        case 'Default':
          setError('Authentication failed. Please check your credentials and try again.');
          break;
        default:
          setError('An authentication error occurred. Please try again.');
      }
    }
  }, [searchParams]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use credentials provider in preview mode
      const provider = isPreviewMode ? 'credentials' : 'onelogin';
      const credentials = isPreviewMode ? { email: 'preview@test.com' } : undefined;
      
      const result = await signIn(provider, {
        callbackUrl: process.env.NEXTAUTH_URL 
          ? `${process.env.NEXTAUTH_URL}/admin`
          : (process.env.NODE_ENV === 'production'
            ? `${window.location.origin}/admin`
            : 'http://localhost:3000/admin'),
        redirect: false, // Handle redirect manually to catch errors
        ...credentials
      });

      if (result?.error) {
        setError('Sign-in failed. Please check your MySMCCD credentials and try again.');
      } else if (result?.url) {
        // Successful sign-in, redirect
        router.push(result.url);
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sign In Button */}
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-primary hover:bg-primary/90 hover:shadow-lg'
        } text-primary-foreground`}
        aria-label={isLoading ? 'Signing in, please wait' : 'Sign in with MySMCCD credentials'}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span>{isPreviewMode ? 'Continue to Preview (No Auth)' : 'Continue with MySMCCD'}</span>
          </>
        )}
      </button>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs" style={{ color: '#6B7280' }}>
          Having trouble signing in?{' '}
          <a 
            href="mailto:webservices@smccd.edu" 
            className="underline"
            style={{ color: '#2563EB' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#1D4ED8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#2563EB'}
          >
            Contact Web Services
          </a>
        </p>
      </div>
    </div>
  );
};

export default OneLoginSignInButton;
