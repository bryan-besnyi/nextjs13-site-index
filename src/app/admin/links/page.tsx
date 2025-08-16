import { Metadata } from 'next';
import LinkHealthDashboard from '@/components/admin/LinkHealthDashboard';

export const metadata: Metadata = {
  title: 'Link Health - Admin Dashboard',
  description: 'Monitor and manage link health across the SMCCCD site index'
};

export default function LinkHealthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Link Health Monitor</h1>
        <p className="text-muted-foreground mt-2">
          Monitor the health of all links in the SMCCCD site index. Identify and fix broken links 
          to maintain a quality user experience.
        </p>
      </div>
      
      <LinkHealthDashboard />
    </div>
  );
}