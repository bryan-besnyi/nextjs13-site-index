import ImportExportClient from '@/components/admin/ImportExportClient';

export const metadata = {
  title: 'Import/Export Data | Admin Dashboard',
  description: 'Import and export index items in bulk'
};

export default function ImportExportPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import/Export Data</h1>
        <p className="text-muted-foreground mt-2">
          Import index items from CSV/JSON files or export existing data
        </p>
      </div>

      <ImportExportClient />
    </div>
  );
}