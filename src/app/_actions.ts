'use server';
import {
  createIndexItem,
  updateIndexItem,
  deleteIndexItem
} from '../lib/indexItems';
import { revalidatePath } from 'next/cache';

export async function createIndexItemAction(
  title: string,
  url: string,
  letter: string,
  campus: string
) {
  const { newIndexItem, error } = await createIndexItem(
    title,
    url,
    letter,
    campus
  );
  if (error) {
    console.error(error);
    return { error };
  } else {
    revalidatePath('/indexItems');
    return { newIndexItem };
  }
}

export async function updateIndexItemAction(
  id: number,
  title: string,
  url: string,
  letter: string,
  campus: string
) {
  const { updatedItem, error } = await updateIndexItem(
    id,
    title,
    url,
    letter,
    campus
  );
  if (error) {
    console.error(error);
    return { error };
  } else {
    revalidatePath('/indexItems');
    return { updatedItem };
  }
}

export async function deleteIndexItemAction(id: string) {
  console.log(`ACTION: Attempting to delete item with ID: ${id}`);
  const numericId = parseInt(id, 10); // Convert the id to a number
  if (isNaN(numericId)) {
    console.error('Invalid ID:', id);
    throw new Error(`Invalid ID: ${id}`);
  }
  try {
    const { deletedItem, error } = await deleteIndexItem(numericId);
    if (error) {
      console.error('Error in deleteIndexItemAction:', error);
      throw error;
    }
    console.log('Deleted item in action:', deletedItem);
    return { deletedItem };
  } catch (error) {
    console.error('Error in deleteIndexItemAction:', error);
    throw error;
  }
}

export async function searchIndexItems(query: string) {
  const response = await fetch(`/api/indexItems?q=${query}`);
  const { results } = await response.json();
  return results;
}
