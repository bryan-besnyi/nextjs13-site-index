'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Database, Clock, Gauge } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const quickActions = [
  { label: 'Add New Item', href: '/admin/new', icon: FileText },
  { label: 'View All Items', href: '/admin/data', icon: Database },
  { label: 'Run Backup', href: '#', icon: Clock, action: 'backup' },
  { label: 'Clear Cache', href: '#', icon: Gauge, action: 'clear-cache' },
];

export default function QuickActions() {
  const handleAction = (actionType: string) => {
    switch (actionType) {
      case 'backup':
        toast('Backup feature coming soon', { icon: 'ℹ️' });
        break;
      case 'clear-cache':
        toast('Cache clearing feature coming soon', { icon: 'ℹ️' });
        break;
      default:
        console.log(`Action: ${actionType}`);
    }
  };

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
              asChild={!action.action}
              onClick={action.action ? () => handleAction(action.action!) : undefined}
            >
              {action.action ? (
                <div className="flex flex-col items-center">
                  <Icon className="h-5 w-5 mb-2" />
                  <span className="text-sm">{action.label}</span>
                </div>
              ) : (
                <Link href={action.href}>
                  <Icon className="h-5 w-5 mb-2" />
                  <span className="text-sm">{action.label}</span>
                </Link>
              )}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}