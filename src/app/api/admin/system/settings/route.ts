import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { kv } from '@vercel/kv';

const DEFAULT_SETTINGS = {
  maintenance: {
    enabled: false,
    message: 'This site is currently under maintenance. Please check back later.',
    scheduledStart: null,
    scheduledEnd: null,
  },
  security: {
    rateLimitEnabled: true,
    rateLimitRequests: 100,
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

// Get system settings
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get settings from KV store
    const storedSettings = await kv.get('system:settings');
    const settings = storedSettings ? { ...DEFAULT_SETTINGS, ...(storedSettings as typeof DEFAULT_SETTINGS) } : DEFAULT_SETTINGS;

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// Update system settings
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newSettings = await request.json();

    // Validate settings structure
    const requiredSections = ['maintenance', 'security', 'backup', 'api', 'database'];
    for (const section of requiredSections) {
      if (!newSettings[section]) {
        return NextResponse.json(
          { error: `Missing required section: ${section}` },
          { status: 400 }
        );
      }
    }

    // Validate specific settings
    if (newSettings.security.rateLimitRequests < 1 || newSettings.security.rateLimitRequests > 1000) {
      return NextResponse.json(
        { error: 'Rate limit requests must be between 1 and 1000' },
        { status: 400 }
      );
    }

    if (newSettings.backup.retentionDays < 1 || newSettings.backup.retentionDays > 30) {
      return NextResponse.json(
        { error: 'Backup retention days must be between 1 and 30' },
        { status: 400 }
      );
    }

    if (newSettings.api.cacheTimeout < 60 || newSettings.api.cacheTimeout > 3600) {
      return NextResponse.json(
        { error: 'Cache timeout must be between 60 and 3600 seconds' },
        { status: 400 }
      );
    }

    // Store settings in KV
    await kv.set('system:settings', newSettings);

    // Log the settings change
    await kv.lpush('system:audit_log', JSON.stringify({
      action: 'settings_updated',
      user: session.user.email,
      timestamp: new Date().toISOString(),
      changes: newSettings
    }));

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings: newSettings
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}