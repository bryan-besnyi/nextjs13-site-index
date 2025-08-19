'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Database,
  Code2,
  Settings,
  ChevronDown,
  ChevronRight,
  FileText,
  Import,
  Activity,
  Archive,
  Shield,
  Terminal,
  Gauge,
  HardDrive,
  Bell
} from 'lucide-react';
import { useState } from 'react';

interface SidebarItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  items?: {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "Data Management",
    icon: Database,
    items: [
      { 
        title: "Browse Items", 
        href: "/admin/data",
        icon: FileText
      },
      { 
        title: "Import/Export", 
        href: "/admin/data/import-export",
        icon: Import
      },
    ],
  },
  {
    title: "Developer Tools",
    icon: Code2,
    items: [
      { 
        title: "API Explorer", 
        href: "/admin/tools/api",
        icon: Terminal
      },
      { 
        title: "Performance", 
        href: "/admin/tools/performance",
        icon: Gauge
      },
      { 
        title: "Cache Manager", 
        href: "/admin/tools/cache",
        icon: HardDrive
      },
      { 
        title: "Alerts", 
        href: "/admin/tools/alerts",
        icon: Bell
      },
    ],
  },
  {
    title: "System",
    icon: Settings,
    items: [
      { 
        title: "Health Status", 
        href: "/admin/system/health",
        icon: Activity
      },
      { 
        title: "Activity Trail", 
        href: "/admin/system/activity",
        icon: Shield
      },
      { 
        title: "Backups", 
        href: "/admin/system/backups",
        icon: Archive
      },
      { 
        title: "Settings", 
        href: "/admin/system/settings",
        icon: Settings
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'Data Management', 
    'Developer Tools'
  ]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isSectionActive = (items?: { href: string }[]) => {
    if (!items) return false;
    return items.some(item => isActive(item.href));
  };

  return (
    <nav 
      className="flex flex-col w-64 border-r border-gray-200 bg-white h-screen sticky top-0 shadow-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-primary">
        <h2 className="text-lg font-semibold text-primary-foreground">SMCCCD Site Index</h2>
        <p className="text-sm text-primary-foreground/80 mt-1">Admin Dashboard</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedSections.includes(item.title);
            const hasSubItems = item.items && item.items.length > 0;
            const sectionActive = isSectionActive(item.items);

            return (
              <li key={item.title}>
                {/* Main item */}
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-primary/10",
                      isActive(item.href) 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-gray-600 hover:text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => hasSubItems && toggleSection(item.title)}
                    className={cn(
                      "flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm transition-all hover:bg-primary/10",
                      sectionActive 
                        ? "text-primary font-medium" 
                        : "text-gray-600 hover:text-primary"
                    )}
                    aria-expanded={isExpanded}
                    aria-controls={hasSubItems ? `submenu-${item.title.replace(/\s+/g, '-').toLowerCase()}` : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </div>
                    {hasSubItems && (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )
                    )}
                  </button>
                )}

                {/* Sub items */}
                {hasSubItems && isExpanded && (
                  <ul 
                    id={`submenu-${item.title.replace(/\s+/g, '-').toLowerCase()}`}
                    className="mt-1 ml-7 space-y-1"
                    role="group"
                    aria-labelledby={`section-${item.title.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {item.items?.map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <li key={subItem.href}>
                          <Link
                            href={subItem.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-primary/10",
                              isActive(subItem.href)
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-gray-500 hover:text-primary"
                            )}
                          >
                            {SubIcon && <SubIcon className="h-4 w-4" />}
                            <span>{subItem.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div 
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500"
          role="status"
          aria-label="System status indicator"
        >
          <Activity className="h-4 w-4 text-green-500" aria-hidden="true" />
          <span>System Status: </span>
          <span className="text-green-600 font-medium">Healthy</span>
        </div>
      </div>
    </nav>
  );
}