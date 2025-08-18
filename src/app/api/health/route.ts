import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-singleton';
import { kv } from '@vercel/kv';
import { QueryCache } from '@/lib/query-cache';

// Health check types based on RFC draft-inadarei-api-health-check-06
type HealthStatus = 'pass' | 'fail' | 'warn';

interface HealthCheck {
  componentId?: string;
  componentType?: 'component' | 'datastore' | 'system';
  observedValue?: any;
  observedUnit?: string;
  status: HealthStatus;
  affectedEndpoints?: string[];
  time?: string;
  output?: string;
  links?: Record<string, string>;
}

interface HealthResponse {
  status: HealthStatus;
  version?: string;
  releaseId?: string;
  notes?: string[];
  output?: string;
  checks?: Record<string, HealthCheck[]>;
  links?: Record<string, string>;
  serviceId?: string;
  description?: string;
  time?: string;
}

// Application version info
const VERSION = process.env.npm_package_version || '1.0.0';
const RELEASE_ID = process.env.VERCEL_GIT_COMMIT_SHA || 'local-dev';

export async function GET(req: NextRequest) {
  const startTime = performance.now();
  
  try {
    // Initialize response structure
    const healthResponse: HealthResponse = {
      status: 'pass',
      version: VERSION,
      releaseId: RELEASE_ID,
      serviceId: 'smcccd-site-index',
      description: 'SMCCCD Site Index API Service',
      checks: {},
      notes: [],
      links: {
        about: '/api/indexItems',
        documentation: 'https://github.com/smcccd/site-index'
      }
    };

    const checks: Record<string, HealthCheck[]> = {};
    let overallStatus: HealthStatus = 'pass';

    // 1. Database Health Check
    try {
      const dbStartTime = performance.now();
      
      // Test basic connectivity first (fastest check)
      await prisma.$queryRaw`SELECT 1 as test`;
      
      // Use optimized cached count query
      const recordCount = await QueryCache.getHealthCheckCount();
      
      const dbResponseTime = Math.round(performance.now() - dbStartTime);

      checks.database = [{
        componentId: 'postgresql-db',
        componentType: 'datastore',
        status: recordCount > 0 ? 'pass' : 'warn',
        observedValue: recordCount,
        observedUnit: 'records',
        time: new Date().toISOString(),
        output: `Database responsive in ${dbResponseTime}ms with ${recordCount} records`,
        affectedEndpoints: ['/api/indexItems', '/admin', '/letter/*', '/search/*']
      }];

      if (recordCount === 0) {
        overallStatus = 'warn';
        healthResponse.notes?.push('Database is accessible but contains no records');
      } else if (recordCount < 1000) {
        overallStatus = 'warn';
        healthResponse.notes?.push('Record count is below expected threshold');
      }

    } catch (dbError) {
      overallStatus = 'fail';
      checks.database = [{
        componentId: 'postgresql-db',
        componentType: 'datastore',
        status: 'fail',
        time: new Date().toISOString(),
        output: `Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
        affectedEndpoints: ['/api/indexItems', '/admin', '/letter/*', '/search/*']
      }];
      healthResponse.notes?.push('Database connectivity failed');
    }

    // 2. Redis/KV Cache Health Check
    try {
      const cacheStartTime = performance.now();
      const testKey = 'health-check-' + Date.now();
      
      // Test write and read operations
      await kv.set(testKey, 'test', { ex: 10 }); // 10 second TTL
      const testValue = await kv.get(testKey);
      await kv.del(testKey); // Cleanup
      
      const cacheResponseTime = Math.round(performance.now() - cacheStartTime);

      checks.cache = [{
        componentId: 'vercel-kv',
        componentType: 'component',
        status: testValue === 'test' ? 'pass' : 'fail',
        observedValue: cacheResponseTime,
        observedUnit: 'ms',
        time: new Date().toISOString(),
        output: `Cache responsive in ${cacheResponseTime}ms`,
        affectedEndpoints: ['/api/indexItems']
      }];

      if (testValue !== 'test') {
        overallStatus = overallStatus === 'fail' ? 'fail' : 'warn';
        healthResponse.notes?.push('Cache read/write operations failed');
      }

    } catch (cacheError) {
      // Cache failure is not critical - API can work without cache
      checks.cache = [{
        componentId: 'vercel-kv',
        componentType: 'component',
        status: 'warn',
        time: new Date().toISOString(),
        output: `Cache unavailable: ${cacheError instanceof Error ? cacheError.message : 'Unknown error'}`,
        affectedEndpoints: ['/api/indexItems']
      }];
      
      if (overallStatus === 'pass') {
        overallStatus = 'warn';
      }
      healthResponse.notes?.push('Cache service unavailable - API will work with degraded performance');
    }

    // 3. API Endpoints Health Check
    try {
      const apiStartTime = performance.now();
      
      // Test internal API endpoint (lightweight query)
      const testUrl = new URL('/api/indexItems?campus=College of San Mateo', req.url);
      const apiResponse = await fetch(testUrl.toString(), {
        headers: {
          'User-Agent': 'health-check-internal',
        }
      });
      
      const apiResponseTime = Math.round(performance.now() - apiStartTime);
      const isApiHealthy = apiResponse.ok;

      checks.api = [{
        componentId: 'indexitems-api',
        componentType: 'component',
        status: isApiHealthy ? 'pass' : 'fail',
        observedValue: apiResponse.status,
        observedUnit: 'http_status',
        time: new Date().toISOString(),
        output: `API endpoint responsive in ${apiResponseTime}ms with status ${apiResponse.status}`,
        affectedEndpoints: ['/api/indexItems']
      }];

      if (!isApiHealthy) {
        overallStatus = 'fail';
        healthResponse.notes?.push('Main API endpoint is not responding correctly');
      }

    } catch (apiError) {
      overallStatus = 'fail';
      checks.api = [{
        componentId: 'indexitems-api',
        componentType: 'component',
        status: 'fail',
        time: new Date().toISOString(),
        output: `API endpoint test failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
        affectedEndpoints: ['/api/indexItems']
      }];
      healthResponse.notes?.push('API endpoint health check failed');
    }

    // 4. System Resources Check
    try {
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const memoryStatus: HealthStatus = memoryUsageMB > 500 ? 'warn' : 'pass';

      checks.system = [{
        componentId: 'nodejs-runtime',
        componentType: 'system',
        status: memoryStatus,
        observedValue: memoryUsageMB,
        observedUnit: 'MB',
        time: new Date().toISOString(),
        output: `Memory usage: ${memoryUsageMB}MB`,
        affectedEndpoints: ['*']
      }];

      if (memoryStatus === 'warn' && overallStatus === 'pass') {
        overallStatus = 'warn';
        healthResponse.notes?.push('High memory usage detected');
      }

    } catch (systemError) {
      // System checks are informational, don't fail overall status
      checks.system = [{
        componentId: 'nodejs-runtime',
        componentType: 'system',
        status: 'warn',
        time: new Date().toISOString(),
        output: `System check failed: ${systemError instanceof Error ? systemError.message : 'Unknown error'}`,
        affectedEndpoints: ['*']
      }];
    }

    // Finalize response
    healthResponse.status = overallStatus;
    healthResponse.checks = checks;
    
    const totalResponseTime = Math.round(performance.now() - startTime);
    healthResponse.output = `Health check completed in ${totalResponseTime}ms`;

    // Determine HTTP status code based on RFC recommendations
    let httpStatus: number;
    switch (overallStatus) {
      case 'pass':
      case 'warn':
        httpStatus = 200; // 2xx range for pass/warn
        break;
      case 'fail':
        httpStatus = 503; // Service Unavailable for fail
        break;
      default:
        httpStatus = 500;
    }

    return new NextResponse(JSON.stringify(healthResponse, null, 2), {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/health+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Health-Check-Time': new Date().toISOString(),
        'X-Response-Time': `${totalResponseTime}ms`
      }
    });

  } catch (error) {
    // Catastrophic failure - return minimal error response
    const errorResponse: HealthResponse = {
      status: 'fail',
      version: VERSION,
      releaseId: RELEASE_ID,
      serviceId: 'smcccd-site-index',
      output: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      time: new Date().toISOString()
    };

    return new NextResponse(JSON.stringify(errorResponse, null, 2), {
      status: 503,
      headers: {
        'Content-Type': 'application/health+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Time': new Date().toISOString()
      }
    });
  }
}

// Support for HEAD requests (common for load balancers)
export async function HEAD(req: NextRequest) {
  try {
    // Lightweight check for HEAD requests
    await prisma.$queryRaw`SELECT 1 as test`;
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/health+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Time': new Date().toISOString()
      }
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'Content-Type': 'application/health+json',
        'X-Health-Check-Time': new Date().toISOString()
      }
    });
  }
}