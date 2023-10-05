'use server'
import { createIndexItem, updateIndexItem } from '../lib/indexItems'
import { revalidatePath } from 'next/cache'

export async function createIndexItemAction(title: string, url: string, letter: string, campus: string) {
  const { newIndexItem, error } = await createIndexItem(title, url, letter, campus);
  if (error) {
    console.error(error);
    return { error };
  } else {
    revalidatePath('/indexItems');
    return { newIndexItem };
  }
}

export async function updateIndexItemAction(id: number, title: string, url: string, letter: string, campus: string) {
  const { updatedItem, error } = await updateIndexItem(id, title, url, letter, campus);
  if (error) {
    console.error(error);
    return { error };
  } else {
    revalidatePath('/indexItems');
    return { updatedItem };
  }
}