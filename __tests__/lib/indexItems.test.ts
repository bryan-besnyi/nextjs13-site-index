/**
 * @jest-environment node
 */
import { 
  getAllIndexItems, 
  createIndexItem, 
  deleteIndexItem, 
  getItemsByLetter,
  getItemsByCampus,
  searchItems
} from '@/lib/indexItems';
import { prisma } from '@/lib/prisma-singleton';
import { kv } from '@vercel/kv';

// Mock dependencies
jest.mock('@/lib/prisma-singleton', () => ({
  prisma: {
    indexitem: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

describe('indexItems library functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllIndexItems', () => {
    it('returns all index items from cache when available', async () => {
      const cachedItems = [
        { id: 1, title: 'Test 1', letter: 'T', url: 'http://test1.com', campus: 'CSM' },
      ];
      
      (kv.get as jest.Mock).mockResolvedValue(cachedItems);
      
      const result = await getAllIndexItems();
      
      expect(result).toEqual(cachedItems);
      expect(kv.get).toHaveBeenCalledWith('all-index-items');
      expect(prisma.indexitem.findMany).not.toHaveBeenCalled();
    });

    it('fetches from database when cache is empty', async () => {
      const dbItems = [
        { id: 1, title: 'Test 1', letter: 'T', url: 'http://test1.com', campus: 'CSM' },
        { id: 2, title: 'Test 2', letter: 'T', url: 'http://test2.com', campus: 'Skyline' },
      ];
      
      (kv.get as jest.Mock).mockResolvedValue(null);
      (prisma.indexitem.findMany as jest.Mock).mockResolvedValue(dbItems);
      
      const result = await getAllIndexItems();
      
      expect(result).toEqual(dbItems);
      expect(prisma.indexitem.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true,
        },
        orderBy: [
          { letter: 'asc' },
          { title: 'asc' },
        ],
      });
      expect(kv.set).toHaveBeenCalledWith('all-index-items', dbItems, { ex: 3600 });
    });

    it('handles database errors gracefully', async () => {
      (kv.get as jest.Mock).mockResolvedValue(null);
      (prisma.indexitem.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));
      
      await expect(getAllIndexItems()).rejects.toThrow('DB Error');
    });
  });

  describe('createIndexItem', () => {
    it('creates a new index item successfully', async () => {
      const newItemData = {
        title: 'New Item',
        letter: 'N',
        url: 'https://new.edu',
        campus: 'College of San Mateo',
      };
      
      const createdItem = { id: 123, ...newItemData, createdAt: new Date(), updatedAt: new Date() };
      (prisma.indexitem.create as jest.Mock).mockResolvedValue(createdItem);
      
      const result = await createIndexItem(newItemData);
      
      expect(result).toEqual(createdItem);
      expect(prisma.indexitem.create).toHaveBeenCalledWith({
        data: newItemData,
      });
      expect(kv.del).toHaveBeenCalledWith('all-index-items');
    });

    it('invalidates related caches after creation', async () => {
      const newItemData = {
        title: 'Art Department',
        letter: 'A',
        url: 'https://art.edu',
        campus: 'Skyline College',
      };
      
      const createdItem = { id: 124, ...newItemData, createdAt: new Date(), updatedAt: new Date() };
      (prisma.indexitem.create as jest.Mock).mockResolvedValue(createdItem);
      
      await createIndexItem(newItemData);
      
      expect(kv.del).toHaveBeenCalledWith('all-index-items');
      expect(kv.del).toHaveBeenCalledWith(`items-letter-A`);
      expect(kv.del).toHaveBeenCalledWith(`items-campus-Skyline College`);
    });

    it('handles creation errors', async () => {
      const newItemData = {
        title: 'Duplicate Item',
        letter: 'D',
        url: 'https://duplicate.edu',
        campus: 'CSM',
      };
      
      (prisma.indexitem.create as jest.Mock).mockRejectedValue(new Error('Unique constraint violation'));
      
      await expect(createIndexItem(newItemData)).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('deleteIndexItem', () => {
    it('deletes an index item by ID', async () => {
      const deletedItem = {
        id: 123,
        title: 'Deleted Item',
        letter: 'D',
        url: 'https://deleted.edu',
        campus: 'College of San Mateo',
      };
      
      (prisma.indexitem.delete as jest.Mock).mockResolvedValue(deletedItem);
      
      const result = await deleteIndexItem(123);
      
      expect(result).toEqual(deletedItem);
      expect(prisma.indexitem.delete).toHaveBeenCalledWith({
        where: { id: 123 },
      });
      expect(kv.del).toHaveBeenCalledWith('all-index-items');
    });

    it('invalidates related caches after deletion', async () => {
      const deletedItem = {
        id: 123,
        title: 'Deleted Item',
        letter: 'D',
        url: 'https://deleted.edu',
        campus: 'Skyline College',
      };
      
      (prisma.indexitem.delete as jest.Mock).mockResolvedValue(deletedItem);
      
      await deleteIndexItem(123);
      
      expect(kv.del).toHaveBeenCalledWith('all-index-items');
      expect(kv.del).toHaveBeenCalledWith(`items-letter-D`);
      expect(kv.del).toHaveBeenCalledWith(`items-campus-Skyline College`);
    });

    it('handles deletion of non-existent item', async () => {
      (prisma.indexitem.delete as jest.Mock).mockRejectedValue(new Error('Record to delete does not exist'));
      
      await expect(deleteIndexItem(999)).rejects.toThrow('Record to delete does not exist');
    });
  });

  describe('getItemsByLetter', () => {
    it('returns items filtered by letter from cache', async () => {
      const letterItems = [
        { id: 1, title: 'Art Department', letter: 'A', url: 'http://art.com', campus: 'CSM' },
      ];
      
      (kv.get as jest.Mock).mockResolvedValue(letterItems);
      
      const result = await getItemsByLetter('A');
      
      expect(result).toEqual(letterItems);
      expect(kv.get).toHaveBeenCalledWith('items-letter-A');
    });

    it('fetches from database when cache miss', async () => {
      const letterItems = [
        { id: 1, title: 'Art Department', letter: 'A', url: 'http://art.com', campus: 'CSM' },
        { id: 2, title: 'Athletics', letter: 'A', url: 'http://athletics.com', campus: 'Skyline' },
      ];
      
      (kv.get as jest.Mock).mockResolvedValue(null);
      (prisma.indexitem.findMany as jest.Mock).mockResolvedValue(letterItems);
      
      const result = await getItemsByLetter('A');
      
      expect(result).toEqual(letterItems);
      expect(prisma.indexitem.findMany).toHaveBeenCalledWith({
        where: { letter: 'A' },
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true,
        },
        orderBy: { title: 'asc' },
      });
      expect(kv.set).toHaveBeenCalledWith('items-letter-A', letterItems, { ex: 3600 });
    });
  });

  describe('getItemsByCampus', () => {
    it('returns items filtered by campus from cache', async () => {
      const campusItems = [
        { id: 1, title: 'CSM Library', letter: 'C', url: 'http://library.csm.edu', campus: 'College of San Mateo' },
      ];
      
      (kv.get as jest.Mock).mockResolvedValue(campusItems);
      
      const result = await getItemsByCampus('College of San Mateo');
      
      expect(result).toEqual(campusItems);
      expect(kv.get).toHaveBeenCalledWith('items-campus-College of San Mateo');
    });

    it('fetches from database when cache miss', async () => {
      const campusItems = [
        { id: 1, title: 'CSM Library', letter: 'C', url: 'http://library.csm.edu', campus: 'College of San Mateo' },
        { id: 2, title: 'CSM Bookstore', letter: 'C', url: 'http://bookstore.csm.edu', campus: 'College of San Mateo' },
      ];
      
      (kv.get as jest.Mock).mockResolvedValue(null);
      (prisma.indexitem.findMany as jest.Mock).mockResolvedValue(campusItems);
      
      const result = await getItemsByCampus('College of San Mateo');
      
      expect(result).toEqual(campusItems);
      expect(prisma.indexitem.findMany).toHaveBeenCalledWith({
        where: { campus: 'College of San Mateo' },
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true,
        },
        orderBy: [
          { letter: 'asc' },
          { title: 'asc' },
        ],
      });
      expect(kv.set).toHaveBeenCalledWith('items-campus-College of San Mateo', campusItems, { ex: 3600 });
    });
  });

  describe('searchItems', () => {
    it('performs case-insensitive title search', async () => {
      const searchResults = [
        { id: 1, title: 'Financial Aid Office', letter: 'F', url: 'http://finaid.edu', campus: 'CSM' },
      ];
      
      (prisma.indexitem.findMany as jest.Mock).mockResolvedValue(searchResults);
      
      const result = await searchItems('financial');
      
      expect(result).toEqual(searchResults);
      expect(prisma.indexitem.findMany).toHaveBeenCalledWith({
        where: {
          title: {
            contains: 'financial',
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true,
        },
        orderBy: [
          { letter: 'asc' },
          { title: 'asc' },
        ],
      });
    });

    it('returns empty array for no matches', async () => {
      (prisma.indexitem.findMany as jest.Mock).mockResolvedValue([]);
      
      const result = await searchItems('nonexistent');
      
      expect(result).toEqual([]);
    });

    it('handles search errors', async () => {
      (prisma.indexitem.findMany as jest.Mock).mockRejectedValue(new Error('Search failed'));
      
      await expect(searchItems('test')).rejects.toThrow('Search failed');
    });
  });
});