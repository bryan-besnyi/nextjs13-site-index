'use server'
import prisma from './prisma'

export async function getIndexItems() {
  try {
    const indexItems = await prisma.indexItem.findMany();
    return { indexItems };
  } catch (error) {
    return { error };
  }
}

export async function getIndexItemById(id: string) {
  try {
    const indexItem = await prisma.indexItem.findUnique({
      where: { id: Number(id) }
    });
    return { indexItem };
  } catch (error) {
    return { error };
  }
}

export async function createIndexItem(title: string, url: string, letter: string, campus: string) {
  try {
    const newIndexItem = await prisma.indexItem.create({
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

export async function updateIndexItem(id: number, title: string, url: string, letter: string, campus: string) {
  try {
    const updatedItem = await prisma.indexItem.update({
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

export async function deleteIndexItem(id: number) {
  try {
    const deletedItem = await prisma.indexItem.delete({
      where: { id: id }
    });
    return { deletedItem };
  } catch (error) {
    return { error };
  }
}
