import NewIndexItemForm from '../../components/NewIndexItemForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Create New Index Item | Site Index'
};

export default function NewIndexItemPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Create New Index Item</h1>
        <p className="text-sm text-gray-500 mt-1">Add a new item to the SMCCCD Site Index</p>
      </div>
      
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              New Index Item
            </CardTitle>
            <p className="text-sm text-muted-foreground">Fill out the form below to create a new index item</p>
          </CardHeader>
          <CardContent>
            <NewIndexItemForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
