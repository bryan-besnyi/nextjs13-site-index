'use server';
import {
  createIndexItem,
  updateIndexItem,
  deleteIndexItem,
  searchIndexItems as searchFromLib
} from '../lib/indexItems';
import { revalidatePath } from 'next/cache';
import { purgeAndWarmCache } from '../lib/cache';

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
    await purgeAndWarmCache();
    revalidatePath(`/letter/${letter}`);
    revalidatePath('/indexItems');
    return { newIndexItem };
  }
}

export async function updateIndexItemAction(
  id: string,
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
    await purgeAndWarmCache();
    revalidatePath(`/letter/${letter}`);
    revalidatePath('/indexItems');
    return { updatedItem };
  }
}

export async function deleteIndexItemAction(id: string) {
  if (isDev) console.log(`ACTION: Attempting to delete item with ID: ${id}`);
  try {
    const { deletedItem, error } = await deleteIndexItem(id);
    if (error) {
      console.error('Error in deleteIndexItemAction:', error);
      throw error;
    }
    if (isDev) console.log('Deleted item in action:', deletedItem);
    await purgeAndWarmCache();
    if (deletedItem) {
      revalidatePath(`/letter/${deletedItem.letter}`);
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
