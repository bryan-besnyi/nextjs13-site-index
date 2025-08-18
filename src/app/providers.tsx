'use client';

import { SessionProvider } from 'next-auth/react';
import { AccessibilityProvider, FocusIndicator } from '@/components/accessibility/AccessibilityProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AccessibilityProvider>
        <FocusIndicator />
        {children}
      </AccessibilityProvider>
    </SessionProvider>
  );
}
