'use client';

import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const focusTrapRef = useFocusTrap(isMobileMenuOpen);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Skip Link for ADA Compliance */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[9999] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
      >
        Skip to main content
      </a>
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div 
            ref={focusTrapRef}
            id="mobile-sidebar"
            className="fixed inset-y-0 left-0 z-50 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <AdminSidebar />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          onMenuClick={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <main 
          id="main-content"
          className="flex-1 overflow-y-auto bg-gray-50"
          role="main"
          aria-label="Main content area"
        >
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}