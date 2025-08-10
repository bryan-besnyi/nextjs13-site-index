/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/system/backups/route';
import fs from 'fs';
import path from 'path';

// Mock fs operations
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock child_process for backup script execution
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

describe('/api/admin/system/backups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/system/backups', () => {
    it('returns list of backup files', async () => {
      const mockBackupFiles = [
        'backup-2024-01-01T10-00.json',
        'backup-2024-01-01T10-00.csv',
        'backup-2024-01-02T10-00.json',
        'backup-2024-01-02T10-00.csv',
      ];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockBackupFiles as any);
      mockFs.statSync.mockReturnValue({
        size: 1024,
        mtime: new Date('2024-01-01T10:00:00Z'),
        isFile: () => true,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/admin/system/backups');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('backups');
      expect(Array.isArray(data.backups)).toBe(true);
      expect(data.backups.length).toBeGreaterThan(0);
    });

    it('handles missing backup directory', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/system/backups');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.backups).toEqual([]);
    });

    it('handles file system errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const request = new NextRequest('http://localhost:3000/api/admin/system/backups');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST /api/admin/system/backups', () => {
    it('triggers backup creation', async () => {
      const { spawn } = require('child_process');
      const mockProcess = {
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
      };
      
      (spawn as jest.Mock).mockReturnValue(mockProcess);

      const request = new NextRequest('http://localhost:3000/api/admin/system/backups', {
        method: 'POST',
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('Backup initiated');
    });

    it('handles backup script failures', async () => {
      const { spawn } = require('child_process');
      const mockProcess = {
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10); // Exit code 1 = failure
          }
        }),
        stdout: { on: jest.fn() },
        stderr: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback('Backup failed');
            }
          }),
        },
      };
      
      (spawn as jest.Mock).mockReturnValue(mockProcess);

      const request = new NextRequest('http://localhost:3000/api/admin/system/backups', {
        method: 'POST',
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });
});