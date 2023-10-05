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

export async function getIndexItemById(id: number) {
  try {
    const indexItem = await prisma.indexItem.findUnique({
      where: { id: id }
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
      where: { id: id },
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