'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteIndexItemAction } from '../_actions';
import { Loader2 } from 'lucide-react';

export interface DeleteButtonProps {
  id: string;
  itemName: string;
}

export default function DeleteButton({ id, itemName }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async (id: string, itemName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${itemName}?`
    );
    if (confirmDelete) {
      setLoading(true);
      try {
        await deleteIndexItemAction(id);
        router.refresh();
      } catch (error) {
        console.error(`Failed to delete item with ID: ${id}`);
        setLoading(false);
      }
    }
  };

  return (
    <button
      className="px-3 py-1 text-sm font-semibold text-red-900 bg-red-200 rounded shadow-sm hover:bg-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:opacity-50"
      onClick={() => handleDelete(id, itemName)}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>Delete <span className="sr-only">{itemName}</span> 🗑️</>
      )}
    </button>
  );
}
