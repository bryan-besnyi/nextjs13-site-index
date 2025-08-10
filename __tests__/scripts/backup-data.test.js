/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');

// Mock Prisma
const mockPrismaClient = {
  indexitem: {
    findMany: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

// Mock fs operations
jest.mock('fs');
const mockFs = fs;

describe('backup-data script', () => {
  let consoleSpy;
  let processExitSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    // Reset fs mock methods
    mockFs.existsSync = jest.fn();
    mockFs.mkdirSync = jest.fn();
    mockFs.writeFileSync = jest.fn();
    mockFs.readdirSync = jest.fn();
    mockFs.statSync = jest.fn();
    mockFs.unlinkSync = jest.fn();
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    processExitSpy.mockRestore();
  });

  it('creates backup directory if it does not exist', async () => {
    const mockData = [
      { 
        id: 1, 
        title: 'Test Item', 
        letter: 'T', 
        url: 'http://test.com', 
        campus: 'CSM',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    mockPrismaClient.indexitem.findMany.mockResolvedValue(mockData);
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readdirSync.mockReturnValue([]);

    // Import and run the backup function
    const backupScript = require('../../scripts/backup-data.js');

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('backups'),
      { recursive: true }
    );
  });

  it('successfully backs up data to JSON and CSV files', async () => {
    const mockData = [
      { 
        id: 1, 
        title: 'Test "Item"', 
        letter: 'T', 
        url: 'http://test.com', 
        campus: 'CSM',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      },
      { 
        id: 2, 
        title: 'Another Item', 
        letter: 'A', 
        url: 'http://another.com', 
        campus: 'Skyline',
        createdAt: new Date('2024-01-01T11:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z'),
      },
    ];

    mockPrismaClient.indexitem.findMany.mockResolvedValue(mockData);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([]);

    // Import and run the backup function
    require('../../scripts/backup-data.js');

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockPrismaClient.indexitem.findMany).toHaveBeenCalledWith({ 
      orderBy: { id: 'asc' } 
    });

    // Check JSON backup was written
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}\.json$/),
      expect.stringContaining('"totalRecords": 2')
    );

    // Check CSV backup was written
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}\.csv$/),
      expect.stringContaining('id,title,letter,url,campus,createdAt,updatedAt')
    );
  });

  it('properly escapes quotes in CSV content', async () => {
    const mockData = [
      { 
        id: 1, 
        title: 'Test "Quoted" Item', 
        letter: 'T', 
        url: 'http://test.com', 
        campus: 'CSM',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    mockPrismaClient.indexitem.findMany.mockResolvedValue(mockData);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([]);

    require('../../scripts/backup-data.js');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check that quotes are properly escaped in CSV
    const csvWriteCall = mockFs.writeFileSync.mock.calls.find(call => 
      call[0].endsWith('.csv')
    );
    expect(csvWriteCall[1]).toContain('Test ""Quoted"" Item');
  });

  it('cleans up old backups older than 7 days', async () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
    const recentDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 days ago

    mockPrismaClient.indexitem.findMany.mockResolvedValue([]);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([
      'backup-old-file.json',
      'backup-recent-file.json',
      'other-file.txt',
    ]);

    mockFs.statSync.mockImplementation((filePath) => {
      if (filePath.includes('backup-old-file.json')) {
        return { mtime: oldDate };
      }
      if (filePath.includes('backup-recent-file.json')) {
        return { mtime: recentDate };
      }
      return { mtime: now };
    });

    require('../../scripts/backup-data.js');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockFs.unlinkSync).toHaveBeenCalledWith(
      expect.stringContaining('backup-old-file.json')
    );
    expect(mockFs.unlinkSync).toHaveBeenCalledWith(
      expect.stringContaining('backup-old-file.csv')
    );
    expect(mockFs.unlinkSync).not.toHaveBeenCalledWith(
      expect.stringContaining('backup-recent-file.json')
    );
  });

  it('handles database errors gracefully', async () => {
    mockPrismaClient.indexitem.findMany.mockRejectedValue(new Error('Database connection failed'));
    mockFs.existsSync.mockReturnValue(true);

    require('../../scripts/backup-data.js');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(consoleSpy.error).toHaveBeenCalledWith(
      '❌ Backup failed:',
      expect.any(Error)
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('disconnects from Prisma client on completion', async () => {
    mockPrismaClient.indexitem.findMany.mockResolvedValue([]);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([]);

    require('../../scripts/backup-data.js');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
  });

  it('disconnects from Prisma client even on error', async () => {
    mockPrismaClient.indexitem.findMany.mockRejectedValue(new Error('Test error'));
    mockFs.existsSync.mockReturnValue(true);

    require('../../scripts/backup-data.js');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
  });

  it('logs successful backup completion', async () => {
    const mockData = [{ id: 1, title: 'Test', letter: 'T', url: 'http://test.com', campus: 'CSM' }];
    
    mockPrismaClient.indexitem.findMany.mockResolvedValue(mockData);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([]);

    require('../../scripts/backup-data.js');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(consoleSpy.log).toHaveBeenCalledWith('🔄 Starting automated backup...');
    expect(consoleSpy.log).toHaveBeenCalledWith('✅ Backup completed: 1 records');
  });
});