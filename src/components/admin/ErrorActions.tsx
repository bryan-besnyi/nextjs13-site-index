'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function ErrorActions() {
  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={() => window.location.reload()}
        variant="default"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh Page
      </Button>
      <Button
        variant="outline"
        onClick={() => window.open('/api/health', '_blank')}
      >
        Check System Health
      </Button>
    </div>
  );
}