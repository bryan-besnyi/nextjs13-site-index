/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/system/environment/route';

// Mock getServerSession
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ user: { email: 'test@smccd.edu' } })),
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
    it('returns sanitized environment information', async () => {
      // Set some test env vars
      process.env.NODE_ENV = 'test';
      process.env.VERCEL_ENV = 'preview';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NEXTAUTH_SECRET = 'super-secret-key';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';

      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('environment');
      expect(data.environment.NODE_ENV).toBe('test');
      expect(data.environment.VERCEL_ENV).toBe('preview');
      // Sensitive data should be masked
      expect(data.environment.DATABASE_URL).toContain('***');
      expect(data.environment.NEXTAUTH_SECRET).toBe('[REDACTED]');
    });

    it('includes system information', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('system');
      expect(data.system).toHaveProperty('nodeVersion');
      expect(data.system).toHaveProperty('platform');
      expect(data.system).toHaveProperty('uptime');
      expect(data.system).toHaveProperty('memory');
    });

    it('identifies production environment correctly', async () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL_ENV = 'production';

      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isProduction).toBe(true);
      expect(data.warnings).toContain('Running in production mode');
    });

    it('detects missing required environment variables', async () => {
      // Remove critical env vars
      delete process.env.DATABASE_URL;
      delete process.env.NEXTAUTH_SECRET;

      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('missingVars');
      expect(data.missingVars).toContain('DATABASE_URL');
      expect(data.missingVars).toContain('NEXTAUTH_SECRET');
    });

    it('includes feature flags and configuration', async () => {
      process.env.ENABLE_CACHE = 'true';
      process.env.RATE_LIMIT_MAX = '100';
      process.env.BACKUP_ENABLED = 'false';

      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('features');
      expect(data.features.cacheEnabled).toBe(true);
      expect(data.features.rateLimitMax).toBe(100);
      expect(data.features.backupEnabled).toBe(false);
    });

    it('calculates system health score', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('healthScore');
      expect(data.healthScore).toBeGreaterThanOrEqual(0);
      expect(data.healthScore).toBeLessThanOrEqual(100);
    });

    it('includes deployment information', async () => {
      process.env.VERCEL_GIT_COMMIT_SHA = 'abc123def456';
      process.env.VERCEL_GIT_COMMIT_REF = 'main';
      process.env.VERCEL_URL = 'my-app.vercel.app';

      const request = new NextRequest('http://localhost:3000/api/admin/system/environment');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('deployment');
      expect(data.deployment.commitSha).toBe('abc123def456');
      expect(data.deployment.branch).toBe('main');
      expect(data.deployment.url).toBe('my-app.vercel.app');
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