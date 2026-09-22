'use server';
import {
  createIndexItem,
  updateIndexItem,
  deleteIndexItem,
  searchIndexItems as searchFromLib
} from '../lib/indexItems';
import { revalidatePath } from 'next/cache';
import { invalidateCache } from '../lib/cache';
import { requireSession } from './api/auth/[...nextauth]/options';

const isDev = process.env.NODE_ENV === 'development';

export async function createIndexItemAction(
  title: string,
  url: string,
  letter: string,
  campus: string
) {
  await requireSession();
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
    await invalidateCache();
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
  await requireSession();
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
    await invalidateCache();
    revalidatePath(`/letter/${letter}`);
    revalidatePath('/indexItems');
    return { updatedItem };
  }
}

export async function deleteIndexItemAction(id: string) {
  await requireSession();
  if (isDev) console.log(`ACTION: Attempting to delete item with ID: ${id}`);
  try {
    const { deletedItem, error } = await deleteIndexItem(id);
    if (error) {
      console.error('Error in deleteIndexItemAction:', error);
      throw error;
    }
    if (isDev) console.log('Deleted item in action:', deletedItem);
    await invalidateCache();
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

// Read-only, same data as the public API, so no session required.
export async function searchIndexItems(query: string, campus?: string) {
  return searchFromLib(query, campus);
}
