/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/system/settings/route';
import { kv } from '@vercel/kv';

// Mock dependencies
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ user: { email: 'admin@smccd.edu' } })),
}));

describe('/api/admin/system/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/system/settings', () => {
    it('returns default settings when none exist', async () => {
      (kv.get as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('settings');
      expect(data.settings).toHaveProperty('cacheEnabled');
      expect(data.settings).toHaveProperty('rateLimitMax');
      expect(data.settings).toHaveProperty('maintenanceMode');
      expect(data.isDefault).toBe(true);
    });

    it('returns stored settings when available', async () => {
      const mockSettings = {
        cacheEnabled: false,
        rateLimitMax: 200,
        maintenanceMode: true,
        backupSchedule: 'daily',
        allowedDomains: ['smccd.edu', 'skylinecollege.edu'],
      };

      (kv.get as jest.Mock).mockResolvedValue(mockSettings);

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.settings).toEqual(mockSettings);
      expect(data.isDefault).toBe(false);
    });

    it('merges stored settings with defaults', async () => {
      const partialSettings = {
        cacheEnabled: false,
        customSetting: 'test',
      };

      (kv.get as jest.Mock).mockResolvedValue(partialSettings);

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.settings.cacheEnabled).toBe(false);
      expect(data.settings.rateLimitMax).toBeDefined(); // From defaults
      expect(data.settings.customSetting).toBe('test');
    });

    it('handles cache errors gracefully', async () => {
      (kv.get as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST /api/admin/system/settings', () => {
    it('updates system settings successfully', async () => {
      const newSettings = {
        cacheEnabled: false,
        rateLimitMax: 50,
        maintenanceMode: true,
      };

      (kv.set as jest.Mock).mockResolvedValue('OK');

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: newSettings }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(kv.set).toHaveBeenCalledWith('system-settings', newSettings);
      expect(data.message).toContain('updated successfully');
    });

    it('validates settings before saving', async () => {
      const invalidSettings = {
        rateLimitMax: -10, // Invalid negative value
        cacheEnabled: 'yes', // Should be boolean
      };

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: invalidSettings }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid settings');
    });

    it('allows partial settings updates', async () => {
      const currentSettings = {
        cacheEnabled: true,
        rateLimitMax: 100,
        maintenanceMode: false,
      };

      (kv.get as jest.Mock).mockResolvedValue(currentSettings);
      (kv.set as jest.Mock).mockResolvedValue('OK');

      const partialUpdate = {
        maintenanceMode: true,
      };

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: partialUpdate, merge: true }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(kv.set).toHaveBeenCalledWith('system-settings', {
        ...currentSettings,
        ...partialUpdate,
      });
    });

    it('resets settings to defaults', async () => {
      (kv.set as jest.Mock).mockResolvedValue('OK');

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings', {
        method: 'POST',
        body: JSON.stringify({ reset: true }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(kv.set).toHaveBeenCalledWith('system-settings', expect.objectContaining({
        cacheEnabled: true,
        maintenanceMode: false,
      }));
      expect(data.message).toContain('reset to defaults');
    });

    it('logs settings changes for audit', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const newSettings = { maintenanceMode: true };
      (kv.set as jest.Mock).mockResolvedValue('OK');

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: newSettings }),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Settings updated by admin@smccd.edu')
      );

      consoleSpy.mockRestore();
    });

    it('handles save errors gracefully', async () => {
      (kv.set as jest.Mock).mockRejectedValue(new Error('Redis save failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: { cacheEnabled: false } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });
});