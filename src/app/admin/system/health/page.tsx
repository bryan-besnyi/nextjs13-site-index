import SystemHealthClient from '@/components/admin/SystemHealthClient';

export const metadata = {
  title: 'System Health | Admin Dashboard',
  description: 'Monitor system health and performance metrics'
};

export default function SystemHealthPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health Monitor</h1>
        <p className="text-muted-foreground mt-2">
          Real-time monitoring of system components and performance metrics
        </p>
      </div>

      <SystemHealthClient />
    </div>
  );
}