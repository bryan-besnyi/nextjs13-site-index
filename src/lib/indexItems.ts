'use server';
import { prisma } from './prisma-singleton';

export async function getIndexItems() {
  try {
    const indexItems = await prisma.indexitem.findMany({
      select: {
        id: true,
        title: true,
        url: true,
        letter: true,
        campus: true
      }
    });
    return { indexItems };
  } catch (error) {
    return { error };
  }
}

/**
 * Searches for index items based on a query.
 * @param query - The search query.
 * @returns An object containing the search results or an error.
 */
export async function searchIndexItems(query: string, campus?: string) {
  try {
    const conditions: any = [
      {
        title: {
          contains: query,
          mode: 'insensitive'
        }
      }
    ];

    if (campus) {
      conditions.push({
        campus: {
          equals: campus,
          mode: 'insensitive'
        }
      });
    }

    const results = await prisma.indexitem.findMany({
      where: {
        AND: conditions
      }
    });

    return { results };
  } catch (error) {
    return { error };
  }
}

/**
 * Retrieves an index item by its ID.
 * @param id - The ID of the index item.
 * @returns An object containing the index item if found, or an error if an error occurred.
 */
export async function getIndexItemById(id: string) {
  try {
    const indexItem = await prisma.indexitem.findUnique({
      where: { id: Number(id) }
    });

    return { indexItem };
  } catch (error) {
    return { error };
  }
}

/**
 * Creates a new index item.
 * @param title - The title of the index item.
 * @param url - The URL of the index item.
 * @param letter - The letter of the index item.
 * @param campus - The campus of the index item.
 * @returns An object containing the newly created index item or an error object.
 */
export async function createIndexItem(
  title: string,
  url: string,
  letter: string,
  campus: string
) {
  try {
    const newIndexItem = await prisma.indexitem.create({
      data: {
        title: title,
        url: url,
        letter: letter,
        campus: campus
      }
    });
    return { newIndexItem };
  } catch (error) {
    return { error };
  }
}

/**
 * Updates an index item with the specified ID.
 *
 * @param id - The ID of the index item to update.
 * @param title - The new title for the index item.
 * @param url - The new URL for the index item.
 * @param letter - The new letter for the index item.
 * @param campus - The new campus for the index item.
 * @returns An object containing the updated index item if successful, or an error object if an error occurred.
 */
export async function updateIndexItem(
  id: number,
  title: string,
  url: string,
  letter: string,
  campus: string
) {
  try {
    const updatedItem = await prisma.indexitem.update({
      where: { id: Number(id) },
      data: {
        title: title,
        url: url,
        letter: letter,
        campus: campus
      }
    });
    return { updatedItem };
  } catch (error) {
    return { error };
  }
}

/**
 * Deletes an index item with the specified ID.
 * @param id - The ID of the index item to delete.
 * @returns A promise that resolves to an object containing the deleted item or an error.
 */
export async function deleteIndexItem(id: number) {
  try {
    const deletedItem = await prisma.indexitem.delete({
      where: { id: id }
    });
    console.log('Deleted item:', deletedItem);
    return { deletedItem };
  } catch (error) {
    console.error('Error in deleteIndexItem:', error);
    return { error };
  }
}
