'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Settings,
  Database,
  BarChart3,
  Activity,
  HardDrive,
  Users,
  FileText,
  Zap,
  Plus,
  Download,
  RefreshCw,
  Terminal,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function CommandPalette({ open, setOpen }: CommandPaletteProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const commands = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      action: () => router.push('/admin'),
      keywords: ['home', 'overview', 'main'],
    },
    {
      id: 'browse-items',
      label: 'Browse Items',
      icon: Database,
      action: () => router.push('/admin/data'),
      keywords: ['data', 'items', 'index', 'browse'],
    },
    {
      id: 'add-item',
      label: 'Add New Item',
      icon: Plus,
      action: () => router.push('/admin/new'),
      keywords: ['create', 'new', 'add'],
    },
    {
      id: 'import-export',
      label: 'Import/Export',
      icon: Download,
      action: () => router.push('/admin/data/import-export'),
      keywords: ['import', 'export', 'backup', 'restore'],
    },
    {
      id: 'bulk-operations',
      label: 'Bulk Operations',
      icon: RefreshCw,
      action: () => router.push('/admin/data/bulk'),
      keywords: ['bulk', 'batch', 'mass'],
    },
    {
      id: 'api-explorer',
      label: 'API Explorer',
      icon: Terminal,
      action: () => router.push('/admin/tools/api'),
      keywords: ['api', 'explorer', 'test', 'endpoints'],
    },
    {
      id: 'performance',
      label: 'Performance Monitor',
      icon: Activity,
      action: () => router.push('/admin/tools/performance'),
      keywords: ['performance', 'monitoring', 'metrics', 'speed'],
    },
    {
      id: 'cache-manager',
      label: 'Cache Manager',
      icon: Zap,
      action: () => router.push('/admin/tools/cache'),
      keywords: ['cache', 'redis', 'memory'],
    },
    {
      id: 'usage-analytics',
      label: 'Usage Analytics',
      icon: BarChart3,
      action: () => router.push('/admin/analytics/usage'),
      keywords: ['analytics', 'usage', 'stats', 'traffic'],
    },
    {
      id: 'search-insights',
      label: 'Search Insights',
      icon: Search,
      action: () => router.push('/admin/analytics/search'),
      keywords: ['search', 'insights', 'queries'],
    },
    {
      id: 'system-health',
      label: 'System Health',
      icon: Activity,
      action: () => router.push('/admin/system/health'),
      keywords: ['health', 'status', 'system'],
    },
    {
      id: 'backups',
      label: 'Database Backups',
      icon: HardDrive,
      action: () => router.push('/admin/system/backups'),
      keywords: ['backup', 'database', 'restore'],
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      action: () => router.push('/admin/system/settings'),
      keywords: ['settings', 'configuration', 'config'],
    },
  ];

  const filteredCommands = commands.filter((command) => {
    const searchTerm = inputValue.toLowerCase();
    return (
      command.label.toLowerCase().includes(searchTerm) ||
      command.keywords.some((keyword) => keyword.includes(searchTerm))
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={inputValue}
              onValueChange={setInputValue}
              placeholder="Type a command or search..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm">
              No results found.
            </Command.Empty>
            
            {filteredCommands.length > 0 && (
              <Command.Group heading="Navigation">
                {filteredCommands.map((command) => {
                  const Icon = command.icon;
                  return (
                    <Command.Item
                      key={command.id}
                      value={command.label}
                      onSelect={() => runCommand(command.action)}
                      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{command.label}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            <Command.Group heading="Quick Actions">
              <Command.Item
                value="refresh page"
                onSelect={() => runCommand(() => window.location.reload())}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Refresh Page</span>
              </Command.Item>
              <Command.Item
                value="api health"
                onSelect={() => runCommand(() => window.open('/api/health', '_blank'))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Activity className="mr-2 h-4 w-4" />
                <span>Check API Health</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}