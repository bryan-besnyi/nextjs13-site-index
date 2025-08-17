'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import { SkipLinks } from '@/components/accessibility/AccessibilityProvider';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Don't show header for auth pages or admin pages
  const isAuthPage = pathname?.startsWith('/auth');
  const isAdminPage = pathname?.startsWith('/admin');
  
  // Define skip links based on page type
  const skipLinks = isAdminPage ? [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#admin-navigation', label: 'Skip to navigation' },
  ] : [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#site-navigation', label: 'Skip to navigation' },
    { href: '#site-search', label: 'Skip to search' },
  ];
  
  if (isAuthPage || isAdminPage) {
    return (
      <>
        {!isAuthPage && <SkipLinks links={skipLinks} />}
        {children}
      </>
    );
  }
  
  return (
    <>
      <SkipLinks links={skipLinks} />
      <Header />
      <main id="main-content" className="bg-gray-50" role="main">
        {children}
      </main>
    </>
  );
}