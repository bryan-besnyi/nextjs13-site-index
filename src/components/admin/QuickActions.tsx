'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Database, Clock, Gauge } from 'lucide-react';
import Link from 'next/link';

const quickActions = [
  { label: 'Add New Item', href: '/admin/new', icon: FileText },
  { label: 'View All Items', href: '/admin/data', icon: Database },
  { label: 'Run Backup', href: '/admin/system/backups', icon: Clock },
  { label: 'Clear Cache', href: '/admin/tools/cache', icon: Gauge },
];

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto flex-col py-4"
              asChild
            >
              <Link href={action.href}>
                <Icon className="h-5 w-5 mb-2" />
                <span className="text-sm">{action.label}</span>
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}