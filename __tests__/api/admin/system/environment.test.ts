/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/system/environment/route';

// Mock next-auth at the module level to prevent headers() calls
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ user: { email: 'test@smccd.edu' } })),
}));

// Mock Next.js headers function to prevent the "headers was called outside a request scope" error
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map([
    ['user-agent', 'test-agent'],
    ['x-forwarded-for', '127.0.0.1']
  ])),
  cookies: jest.fn(() => new Map())
}));

describe('/api/admin/system/environment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset env to original
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET /api/admin/system/environment', () => {
    it('returns environment information', async () => {
      // Set some test env vars
      process.env.NODE_ENV = 'test';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';

      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('environment');
      expect(data.environment).toBe('test');
      expect(data).toHaveProperty('nodeVersion');
      expect(data).toHaveProperty('nextjsVersion');
      expect(data).toHaveProperty('databaseUrl');
      expect(data).toHaveProperty('deploymentUrl');
      expect(data.deploymentUrl).toBe('http://localhost:3000');
    });

    it('includes system information', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('nodeVersion');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('memoryUsage');
      expect(data).toHaveProperty('processInfo');
      expect(data.processInfo).toHaveProperty('platform');
      expect(data.processInfo).toHaveProperty('pid');
      expect(data.processInfo).toHaveProperty('arch');
    });

    it('identifies production environment correctly', async () => {
      process.env.NODE_ENV = 'production';

      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.environment).toBe('production');
    });

    it('handles missing database URL', async () => {
      // Remove critical env vars
      delete process.env.DATABASE_URL;

      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.databaseUrl).toBe('Not configured');
    });

    it('includes memory and process information', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('memoryUsage');
      expect(data.memoryUsage).toHaveProperty('used');
      expect(data.memoryUsage).toHaveProperty('total');
      expect(data.memoryUsage).toHaveProperty('percentage');
      expect(data).toHaveProperty('processInfo');
      expect(data.processInfo).toHaveProperty('cpuCount');
      expect(data.processInfo).toHaveProperty('heapUsed');
    });

    it('includes uptime information', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('lastRestart');
      expect(typeof data.uptime).toBe('string');
      expect(typeof data.lastRestart).toBe('string');
    });

    it('includes Next.js version', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('nextjsVersion');
      expect(typeof data.nextjsVersion).toBe('string');
    });

    it('handles errors gracefully', async () => {
      // Mock process to throw error
      const originalProcess = global.process;
      global.process = {
        ...originalProcess,
        env: new Proxy({}, {
          get() {
            throw new Error('Environment access denied');
          }
        })
      } as any;

      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');

      // Restore process
      global.process = originalProcess;
    });
  });
});