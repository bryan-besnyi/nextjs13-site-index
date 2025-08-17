'use client';

import { SessionProvider } from 'next-auth/react';
import { AccessibilityProvider, AccessibilityDebugPanel, FocusIndicator } from '@/components/accessibility/AccessibilityProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AccessibilityProvider>
        <FocusIndicator />
        {children}
        <AccessibilityDebugPanel />
      </AccessibilityProvider>
    </SessionProvider>
  );
}
