'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Don't show header for auth pages or admin pages
  const isAuthPage = pathname?.startsWith('/auth');
  const isAdminPage = pathname?.startsWith('/admin');
  
  if (isAuthPage || isAdminPage) {
    return <>{children}</>;
  }
  
  return (
    <>
      <Header />
      <main className="bg-gray-50">{children}</main>
    </>
  );
}