import BulkOperationsClient from '@/components/admin/BulkOperationsClient';

export const metadata = {
  title: 'Bulk Operations | Admin Dashboard',
  description: 'Perform bulk operations on index items'
};

export default function BulkOperationsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Operations</h1>
        <p className="text-muted-foreground mt-2">
          Perform batch operations on multiple index items efficiently
        </p>
      </div>

      <BulkOperationsClient />
    </div>
  );
}