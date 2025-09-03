import { searchIndexItems } from '@/lib/indexItems';
import DataTableEnhanced from '@/components/admin/DataTableEnhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Database } from 'lucide-react';
import ErrorActions from '@/components/admin/ErrorActions';

export default async function AdminDataPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; campus?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || '';
  const campus = params.campus || '';
  const page = parseInt(params.page || '1');
  
  let initialData: any[] = [];
  let hasError = false;
  let errorMessage = '';

  try {
    // Server-side data fetching with error handling
    const response = await searchIndexItems(query, campus);
    
    if (response.error) {
      throw new Error(response.error instanceof Error ? response.error.message : 'Database error');
    }
    
    initialData = response.results || [];
  } catch (error) {
    hasError = true;
    errorMessage = error instanceof Error ? error.message : 'Failed to load data';
    console.error('Admin data page error:', error);
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Browse Index Items</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and search through all index items</p>
        </div>

        {/* Error Display */}
        <div>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-xl text-red-800">Failed to Load Data</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-red-700">{errorMessage}</p>
              <div className="space-y-2">
                <p className="text-sm text-red-600">This could be due to:</p>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• Database connection issues</li>
                  <li>• Server overload or maintenance</li>
                  <li>• Network connectivity problems</li>
                </ul>
              </div>
              <div className="flex justify-center">
                <ErrorActions />
              </div>
              <p className="text-xs text-red-500 pt-2 border-t border-red-200">
                If this persists, contact{' '}
                <a 
                  href="mailto:webmaster@smccd.edu"
                  className="text-red-600 hover:underline font-medium"
                >
                  Web Services
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Browse Index Items</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and search through all index items</p>
      </div>

      {/* Data Table */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DataTableEnhanced initialData={initialData} />
      </div>
    </div>
  );
}