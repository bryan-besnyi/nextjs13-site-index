'use client';

import { useSession, signOut } from 'next-auth/react';
import {
  User,
  LogOut,
  Command,
  Menu,
  X,
  Search,
  Activity,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminHeaderProps {
  onMenuClick?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function AdminHeader({ onMenuClick, isMobileMenuOpen }: AdminHeaderProps) {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const openCommandPalette = () => {
    // Trigger command palette (will implement later)
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      ctrlKey: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center px-6 gap-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-sidebar"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {/* Command palette trigger */}
        <Button
          variant="outline"
          className="flex-1 md:flex-none md:w-80 justify-between text-sm text-gray-500 border-gray-200"
          onClick={openCommandPalette}
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search or run commands...
          </span>
          <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{session?.user?.name || 'Developer'}</p>
                  <p className="text-xs text-gray-500">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.open('/api/health', '_blank')}>
                <Activity className="mr-2 h-4 w-4" />
                System Health
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open('/api/metrics', '_blank')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Performance Metrics
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}