import { prisma } from '@/lib/prisma-singleton';
import { notFound } from 'next/navigation';
import EditIndexItemForm from '@/components/admin/EditIndexItemForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Edit Index Item | Admin Dashboard',
  description: 'Edit index item details'
};

interface AdminEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminEditPage({
  params
}: AdminEditPageProps) {
  const { id } = await params;
  
  let indexItem = null;
  let hasError = false;
  let errorMessage = '';

  try {
    indexItem = await prisma.indexitem.findUnique({
      where: { id: Number(id) }
    });

    if (!indexItem) {
      notFound();
    }
  } catch (error) {
    hasError = true;
    errorMessage = error instanceof Error ? error.message : 'Failed to load item';
    console.error('Edit page error:', error);
  }

  if (hasError) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Error Loading Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{errorMessage}</p>
            <p className="text-sm text-red-600 mt-2">
              The item with ID &ldquo;{id}&rdquo; could not be loaded. Please check the ID and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!indexItem) {
    return notFound();
  }

  return <EditIndexItemForm item={indexItem} />;
}
