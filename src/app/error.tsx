'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error);
    }
    
    // In production, log to an error reporting service
    // Example: Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-xl">Something went wrong!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            An error occurred while loading this page. Please try again.
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm font-medium">
                Error details
              </summary>
              <div className="mt-2 space-y-1">
                <p className="text-xs font-mono bg-gray-100 p-2 rounded overflow-auto">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            </details>
          )}
          
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
            <Button variant="outline" onClick={reset}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}