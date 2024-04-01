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
        const { deletedItem } = await deleteIndexItemAction(id);
        console.log(`Successfully deleted item: ${deletedItem}`);
      } catch (error) {
        console.error(`Failed to delete item with ID: ${id}`);
      }
    }
  };

  return (
    <button onClick={() => handleDelete(id, itemName)}>
      Delete <span className="sr-only">{itemName}</span>
    </button>
  );
}
