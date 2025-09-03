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
        <h1 className="text-2xl font-semibold text-gray-900">Import/Export Data</h1>
        <p className="text-sm text-gray-500 mt-1">Import index items from CSV/JSON files or export existing data</p>
      </div>

      <ImportExportClient />
    </div>
  );
}