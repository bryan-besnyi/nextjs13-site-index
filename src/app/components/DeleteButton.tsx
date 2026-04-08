'use client';

import { deleteIndexItemAction } from '../_actions';

export interface DeleteButtonProps {
  id: string;
  itemName: string;
}

export default function DeleteButton({ id, itemName }: DeleteButtonProps) {
  const handleDelete = async (id: string, itemName: string) => {
    console.log('Deleting item:', id, itemName);
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${itemName}?`
    );
    if (confirmDelete) {
      try {
        const { deletedItem } = await deleteIndexItemAction(id);
        console.log(`Successfully deleted item: ${deletedItem}`);
      } catch (error) {
        console.error(`Failed to delete item with ID: ${id}`);
      }
    }
  };

  return (
    <button
      className="px-3 py-1 text-sm font-semibold text-red-900 bg-red-200 rounded shadow-sm hover:bg-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
      onClick={() => handleDelete(id, itemName)}
    >
      Delete <span className="sr-only">{itemName}</span> 🗑️
    </button>
  );
}
