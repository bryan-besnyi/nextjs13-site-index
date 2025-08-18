/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/admin/system/settings/route';
import { kv } from '@vercel/kv';
import { resetAuthMocks, setAuthenticatedSession, setUnauthenticatedSession } from '../../../setup/mockNextAuth';

// Mock dependencies
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    lpush: jest.fn(),
  },
}));

describe('/api/admin/system/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthMocks();
  });

  describe('GET /api/admin/system/settings', () => {
    it('returns default settings when none exist', async () => {
      setAuthenticatedSession(); // Ensure authenticated state
      (kv.get as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // The actual API returns the settings directly, not nested under a 'settings' property
      expect(data).toHaveProperty('maintenance');
      expect(data).toHaveProperty('security');
      expect(data).toHaveProperty('backup');
      expect(data).toHaveProperty('api');
      expect(data).toHaveProperty('database');
    });

    it('returns stored settings when available', async () => {
      setAuthenticatedSession();
      const mockSettings = {
        maintenance: { enabled: true, message: 'Custom maintenance message' },
        security: { rateLimitRequests: 200, rateLimitWindow: 60, blockSuspiciousUserAgents: true, requireHttps: true },
        backup: { enabled: true, frequency: 'daily', retentionDays: 14, location: './custom-backups' },
        api: { enableCaching: false, cacheTimeout: 600, enableLogging: true, logLevel: 'debug' },
        database: { connectionPoolSize: 20, queryTimeout: 3000, enableSlowQueryLog: true, slowQueryThreshold: 500 },
      };

      (kv.get as jest.Mock).mockResolvedValue(mockSettings);

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.maintenance.enabled).toBe(true);
      expect(data.security.rateLimitRequests).toBe(200);
      expect(data.api.enableCaching).toBe(false);
    });

    it('merges stored settings with defaults', async () => {
      setAuthenticatedSession();
      const partialSettings = {
        maintenance: { enabled: true },
        // Missing other required sections - should be merged with defaults
      };

      (kv.get as jest.Mock).mockResolvedValue(partialSettings);

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.maintenance.enabled).toBe(true); // From stored settings
      expect(data.security).toBeDefined(); // From defaults
      expect(data.backup).toBeDefined(); // From defaults
      expect(data.api).toBeDefined(); // From defaults
      expect(data.database).toBeDefined(); // From defaults
    });

    it('handles cache errors gracefully', async () => {
      setAuthenticatedSession();
      (kv.get as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('PUT /api/admin/system/settings', () => {
    it('updates system settings successfully', async () => {
      setAuthenticatedSession();
      const newSettings = {
        maintenance: {
          enabled: false,
          message: 'Test maintenance message',
          scheduledStart: null,
          scheduledEnd: null,
        },
        security: {
          rateLimitEnabled: true,
          rateLimitRequests: 50,
          rateLimitWindow: 60,
          blockSuspiciousUserAgents: true,
          requireHttps: true,
        },
        backup: {
          enabled: true,
          frequency: '30min',
          retentionDays: 7,
          location: './backups',
        },
        api: {
          enableCaching: true,
          cacheTimeout: 300,
          enableLogging: true,
          logLevel: 'info',
        },
        database: {
          connectionPoolSize: 10,
          queryTimeout: 5000,
          enableSlowQueryLog: true,
          slowQueryThreshold: 1000,
        },
      };

      (kv.set as jest.Mock).mockResolvedValue('OK');
      (kv.lpush as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(kv.set).toHaveBeenCalledWith('system:settings', newSettings);
      expect(data.message).toContain('updated successfully');
    });

    it('validates settings before saving', async () => {
      setAuthenticatedSession();
      const invalidSettings = {
        maintenance: { enabled: false },
        security: {
          rateLimitRequests: -10, // Invalid negative value
          rateLimitWindow: 60,
          blockSuspiciousUserAgents: true,
          requireHttps: true,
        },
        // Missing required sections
      };

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings', {
        method: 'PUT',
        body: JSON.stringify(invalidSettings),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Missing required section');
    });

    it('handles save errors gracefully', async () => {
      setAuthenticatedSession();
      (kv.set as jest.Mock).mockRejectedValue(new Error('Redis save failed'));

      const validSettings = {
        maintenance: { enabled: false, message: 'Test', scheduledStart: null, scheduledEnd: null },
        security: { rateLimitEnabled: true, rateLimitRequests: 100, rateLimitWindow: 60, blockSuspiciousUserAgents: true, requireHttps: true },
        backup: { enabled: true, frequency: '30min', retentionDays: 7, location: './backups' },
        api: { enableCaching: true, cacheTimeout: 300, enableLogging: true, logLevel: 'info' },
        database: { connectionPoolSize: 10, queryTimeout: 5000, enableSlowQueryLog: true, slowQueryThreshold: 1000 },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings', {
        method: 'PUT',
        body: JSON.stringify(validSettings),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });

    it('requires authentication', async () => {
      setUnauthenticatedSession();

      const validSettings = {
        maintenance: { enabled: false, message: 'Test' },
        security: { rateLimitRequests: 100, rateLimitWindow: 60, blockSuspiciousUserAgents: true, requireHttps: true },
        backup: { enabled: true, frequency: '30min', retentionDays: 7, location: './backups' },
        api: { enableCaching: true, cacheTimeout: 300, enableLogging: true, logLevel: 'info' },
        database: { connectionPoolSize: 10, queryTimeout: 5000, enableSlowQueryLog: true, slowQueryThreshold: 1000 },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/system/settings', {
        method: 'PUT',
        body: JSON.stringify(validSettings),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});