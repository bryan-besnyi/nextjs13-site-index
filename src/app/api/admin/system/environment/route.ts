import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../auth/[...nextauth]/options';
import os from 'os';

// Get environment information
export async function GET(request: NextRequest) {
  try {
    // Check if we're in preview/development mode
    const isPreviewMode = process.env.VERCEL_ENV === 'preview' || process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV === 'development';
    
    // Check authentication only in production
    if (!isPreviewMode) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Calculate uptime
    const uptimeSeconds = process.uptime();
    const uptimeDays = Math.floor(uptimeSeconds / (24 * 60 * 60));
    const uptimeHours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
    const uptimeMinutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
    
    const uptimeString = uptimeDays > 0 
      ? `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`
      : uptimeHours > 0 
        ? `${uptimeHours}h ${uptimeMinutes}m`
        : `${uptimeMinutes}m`;

    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // Get Next.js version from package.json
    let nextjsVersion = 'Unknown';
    try {
      const packageJson = require(process.cwd() + '/package.json');
      nextjsVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next || 'Unknown';
    } catch (e) {
      // Fallback if package.json can't be read
    }

    const envInfo = {
      nodeVersion: process.version,
      nextjsVersion: nextjsVersion,
      databaseUrl: process.env.DATABASE_URL || 'Not configured',
      deploymentUrl: process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000',
      environment: process.env.NODE_ENV || 'development',
      vercelEnv: process.env.VERCEL_ENV || 'Not set',
      bypassAuth: process.env.BYPASS_AUTH || 'Not set',
      isPreviewMode: isPreviewMode,
      lastRestart: new Date(Date.now() - (uptimeSeconds * 1000)).toISOString(),
      uptime: uptimeString,
      memoryUsage: {
        used: usedMemory,
        total: totalMemory,
        percentage: memoryPercentage
      },
      processInfo: {
        pid: process.pid,
        platform: os.platform(),
        arch: os.arch(),
        cpuCount: os.cpus().length,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      }
    };

    return NextResponse.json(envInfo);
  } catch (error) {
    console.error('Environment info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch environment information' },
      { status: 500 }
    );
  }
}