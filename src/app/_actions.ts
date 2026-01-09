'use server';
import {
  createIndexItem,
  updateIndexItem,
  deleteIndexItem,
  searchIndexItems as searchFromLib
} from '../lib/indexItems';
import { revalidatePath } from 'next/cache';
import { kv } from '@vercel/kv';

const isDev = process.env.NODE_ENV === 'development';

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
    // Invalidate cache
    const keys = await kv.keys(`index:${campus}:*`);
    if (keys.length > 0) await kv.del(...keys);
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
    // Invalidate cache
    const keys = await kv.keys(`index:${campus}:*`);
    if (keys.length > 0) await kv.del(...keys);
    revalidatePath('/indexItems');
    return { updatedItem };
  }
}

export async function deleteIndexItemAction(id: string) {
  if (isDev) console.log(`ACTION: Attempting to delete item with ID: ${id}`);
  const numericId = parseInt(id, 10);
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
    if (isDev) console.log('Deleted item in action:', deletedItem);
    // Invalidate cache
    if (deletedItem) {
      const keys = await kv.keys(`index:${deletedItem.campus}:*`);
      if (keys.length > 0) await kv.del(...keys);
    }
    revalidatePath('/admin');
    return { deletedItem };
  } catch (error) {
    console.error('Error in deleteIndexItemAction:', error);
    throw error;
  }
}

export async function searchIndexItems(query: string, campus?: string) {
  // Use the lib function directly instead of fetch (server action can't use relative URLs)
  const { results, error } = await searchFromLib(query, campus);
  if (error) {
    console.error('Search error:', error);
    return [];
  }
  return results || [];
}
