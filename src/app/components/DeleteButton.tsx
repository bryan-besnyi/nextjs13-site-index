'use client';

import { deleteIndexItemAction } from '../_actions';

export interface DeleteButtonProps {
  id: number;
  itemName: string;
}

export default function DeleteButton({ id, itemName }: DeleteButtonProps) {
  const handleDelete = async (id: number, itemName: string) => {
    console.log('Deleting item:', id, itemName);
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${itemName}?`
    );
    if (confirmDelete) {
      try {
        const { deletedItem } = await deleteIndexItemAction(id.toString()); // Convert id to string
        console.log(`Successfully deleted item: ${deletedItem}`);
      } catch (error) {
        console.error(`Failed to delete item with ID: ${id}`);
      }
    }
  };

  return (
    <button
      className="px-3 py-1 text-sm font-semibold text-red-900 bg-red-200 rounded shadow-sm hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
      onClick={() => handleDelete(id, itemName)}
      aria-label={`Delete ${itemName}`}
      type="button"
    >
      Delete
      <span aria-hidden="true" className="ml-1">🗑️</span>
    </button>
  );
}
