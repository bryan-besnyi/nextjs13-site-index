import { Metadata } from 'next';
import BackupsClient from '@/components/admin/BackupsClient';

export const metadata: Metadata = {
  title: 'Database Backups | Admin Dashboard',
  description: 'Manage and download database backups'
};

export default function BackupsPage() {
  return (
    <div className="p-6">
      <BackupsClient />
    </div>
  );
}