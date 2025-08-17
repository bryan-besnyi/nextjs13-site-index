import { Metadata } from 'next';
import AlertsDashboard from '@/components/admin/AlertsDashboard';

export const metadata: Metadata = {
  title: 'Performance Alerts | Admin Dashboard',
  description: 'Monitor and manage performance alerts for the SMCCCD Site Index'
};

export default function AlertsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Performance Alerts</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system performance and manage alerts for response times, errors, and resource usage.
        </p>
      </div>

      <AlertsDashboard />
    </div>
  );
}