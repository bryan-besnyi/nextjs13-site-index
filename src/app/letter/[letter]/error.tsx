'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LetterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    console.error('Letter page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
          <CardTitle className="text-lg">Unable to load letter page</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load the items for this letter. This might be a temporary issue.
          </p>
          
          <div className="flex gap-2 justify-center">
            <Button size="sm" onClick={() => window.location.href = '/'}>
              Back to Index
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}