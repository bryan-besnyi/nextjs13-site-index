import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import OneLoginSignInButton from '../../components/SignInButton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Shield, Building2, Users } from 'lucide-react';
import './signin.css';

export default function SignInPage() {
  // Check if we're in preview mode
  const isPreviewMode = process.env.VERCEL_ENV === 'preview' || process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV === 'development';
  
  // Auto-redirect in preview/development environments
  if (isPreviewMode) {
    redirect('/admin');
    return null; // This won't be reached but helps with TypeScript
  }
  
  return (
    <>
    <div className="signin-page flex items-center justify-center min-h-screen px-4">
      {/* Skip Link for ADA Compliance */}
      <a
        href="#signin-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Skip to sign in form
      </a>

      <div className="w-full max-w-lg">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#111827' }}>
            SMCCCD Site Index
          </h1>
          <p className="text-lg" style={{ color: '#4B5563' }}>
            Admin Dashboard
          </p>
        </div>
        
        {/* Preview Mode Notice */}
        {isPreviewMode && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium text-center">
              🚧 Preview Mode - Authentication Bypassed for Testing
            </p>
          </div>
        )}
        
        {/* Main Sign In Card */}
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur" style={{ color: '#000000' }}>
          <CardHeader className="text-center pb-4">
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#111827' }}>
              {isPreviewMode ? 'Preview Access' : 'College Web Developer Access'}
            </h2>
            <p className="text-sm" style={{ color: '#4B5563' }}>
              {isPreviewMode 
                ? 'Click below to access the preview environment' 
                : 'Sign in with your MySMCCD credentials to manage the site index'}
            </p>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div id="signin-form" role="main" aria-label="Sign in form">
              <Suspense fallback={
                <div className="flex justify-center py-8" role="status" aria-label="Loading sign in options">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                </div>
              }>
                <OneLoginSignInButton />
              </Suspense>
            </div>
          </CardContent>
        </Card>
        
        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-white/80 backdrop-blur rounded-lg p-4 text-center">
            <Building2 className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium mb-1" style={{ color: '#111827' }}>4 Campuses</p>
            <p className="text-xs" style={{ color: '#4B5563' }}>CSM • Cañada • Skyline • DO</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-lg p-4 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium mb-1" style={{ color: '#111827' }}>Authorized Access</p>
            <p className="text-xs" style={{ color: '#4B5563' }}>Web Developers Only</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Need help accessing your account?{' '}
            <a 
              href="mailto:webmaster@smccd.edu" 
              className="text-primary hover:text-primary/80 font-medium underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              Contact Web Services
            </a>
          </p>
        </div>
        
        {/* Security Notice */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg border-l-4 border-primary">
          <p className="text-xs" style={{ color: '#374151' }}>
            <strong>Security Notice:</strong> This system is for authorized personnel only. 
            All activities are monitored and logged.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
