import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma-singleton';
import { put, list, del } from '@vercel/blob';

// Get all backup files and statistics
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

    // List all backup files from Vercel Blob
    const { blobs } = await list({
      prefix: 'backups/',
      limit: 1000
    });

    // If no backups exist, seed initial backup for preview
    if (blobs.length === 0 && isPreviewMode) {
      await seedInitialBackup();
      
      // Re-fetch after seeding
      const { blobs: newBlobs } = await list({
        prefix: 'backups/',
        limit: 1000
      });

      return formatBackupResponse(newBlobs, true);
    }

    return formatBackupResponse(blobs, false);

  } catch (error) {
    console.error('Backups fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backup information' },
      { status: 500 }
    );
  }
}

// Helper function to format backup response
function formatBackupResponse(blobs: any[], isSeeded: boolean) {
  const backupFiles = blobs
    .filter(blob => blob.pathname.includes('backup-') && (blob.pathname.endsWith('.json') || blob.pathname.endsWith('.csv')))
    .map(blob => {
      const filename = blob.pathname.split('/').pop() || '';
      const type = filename.endsWith('.json') ? 'json' : 'csv';
      
      // For JSON files, we can't easily get record count without downloading
      // For display purposes, we'll estimate based on file size
      let records = undefined;
      if (type === 'json') {
        // Rough estimate: ~160 bytes per record in JSON
        records = Math.round(blob.size / 160);
      }

      return {
        name: filename,
        size: blob.size,
        date: blob.uploadedAt,
        type,
        records,
        url: blob.url
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate statistics
  const totalBackups = backupFiles.length;
  const totalSize = backupFiles.reduce((sum, file) => sum + file.size, 0);
  const lastBackup = backupFiles.length > 0 ? backupFiles[0].date : null;
  const oldestBackup = backupFiles.length > 0 ? backupFiles[backupFiles.length - 1].date : null;
  const avgSize = totalBackups > 0 ? totalSize / totalBackups : 0;

  const stats = {
    totalBackups,
    totalSize,
    lastBackup,
    oldestBackup,
    avgSize
  };

  const response: any = { backups: backupFiles, stats };
  
  if (isSeeded) {
    response.note = 'Initial backup created for preview environment';
  }

  return NextResponse.json(response);
}

// Seed initial backup for preview environment
async function seedInitialBackup() {
  try {
    // Get sample data from database
    const indexItems = await prisma.indexitem.findMany({
      take: 50, // Just a sample for preview
      orderBy: { id: 'desc' }
    });

    const now = new Date();
    const timestamp = now.toISOString().slice(0, 10); // YYYY-MM-DD format for daily backups
    
    // Create backup data
    const backupData = {
      indexItems,
      backupDate: now.toISOString(),
      totalRecords: indexItems.length,
      createdBy: 'preview-seed',
      environment: 'preview'
    };

    // Upload JSON backup
    const jsonBlob = await put(
      `backups/backup-${timestamp}.json`,
      JSON.stringify(backupData, null, 2),
      {
        access: 'public',
        addRandomSuffix: false
      }
    );

    // Create CSV content
    const csvContent = [
      'id,title,letter,url,campus,createdAt,updatedAt',
      ...indexItems.map(item => 
        `${item.id},"${item.title.replace(/"/g, '""')}","${item.letter}","${item.url}","${item.campus}","${item.createdAt}","${item.updatedAt}"`
      )
    ].join('\n');

    // Upload CSV backup
    const csvBlob = await put(
      `backups/backup-${timestamp}.csv`,
      csvContent,
      {
        access: 'public',
        addRandomSuffix: false
      }
    );

    console.log('Seeded initial backups:', { json: jsonBlob.url, csv: csvBlob.url });
    
  } catch (error) {
    console.error('Failed to seed initial backup:', error);
  }
}

// Create a new backup
export async function POST(request: NextRequest) {
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

    const now = new Date();
    const timestamp = now.toISOString().slice(0, 10); // Daily backups: YYYY-MM-DD
    
    // Get all data
    const indexItems = await prisma.indexitem.findMany({ orderBy: { id: 'asc' } });
    
    const session = isPreviewMode ? null : await getServerSession(authOptions);
    const backupData = {
      indexItems,
      backupDate: now.toISOString(),
      totalRecords: indexItems.length,
      createdBy: isPreviewMode ? 'preview-user' : session?.user?.email || 'unknown',
      environment: isPreviewMode ? 'preview' : 'production'
    };

    // Upload JSON backup to Vercel Blob
    const jsonBlob = await put(
      `backups/backup-${timestamp}.json`,
      JSON.stringify(backupData, null, 2),
      {
        access: 'public',
        addRandomSuffix: false
      }
    );

    // Create CSV content
    const csvContent = [
      'id,title,letter,url,campus,createdAt,updatedAt',
      ...indexItems.map(item => 
        `${item.id},"${item.title.replace(/"/g, '""')}","${item.letter}","${item.url}","${item.campus}","${item.createdAt}","${item.updatedAt}"`
      )
    ].join('\n');

    // Upload CSV backup to Vercel Blob
    const csvBlob = await put(
      `backups/backup-${timestamp}.csv`,
      csvContent,
      {
        access: 'public',
        addRandomSuffix: false
      }
    );

    // Clean up old backups (28-day retention)
    await cleanupOldBackups();

    return NextResponse.json({ 
      message: 'Backup created successfully',
      filename: `backup-${timestamp}`,
      records: indexItems.length,
      urls: {
        json: jsonBlob.url,
        csv: csvBlob.url
      }
    });
  } catch (error) {
    console.error('Backup creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

// Clean up backups older than 28 days
async function cleanupOldBackups() {
  try {
    const { blobs } = await list({
      prefix: 'backups/',
      limit: 1000
    });

    const cutoffDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000); // 28 days ago

    for (const blob of blobs) {
      const uploadDate = new Date(blob.uploadedAt);
      
      if (uploadDate < cutoffDate) {
        console.log(`Deleting old backup: ${blob.pathname}`);
        await del(blob.url);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup old backups:', error);
  }
}