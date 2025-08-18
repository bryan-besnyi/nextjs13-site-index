import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../../auth/[...nextauth]/options';
import { list, del } from '@vercel/blob';

// Download a backup file
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
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

    const params = await context.params;
    const filename = decodeURIComponent(params.filename);
    
    // Security check: ensure filename is safe
    if (!filename.startsWith('backup-') || (!filename.endsWith('.json') && !filename.endsWith('.csv'))) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    // Find the backup in Vercel Blob
    const { blobs } = await list({
      prefix: 'backups/',
      limit: 1000
    });
    
    const backup = blobs.find(blob => blob.pathname === `backups/${filename}`);
    
    if (!backup) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Redirect to the blob URL for download
    // This is more efficient than proxying the file through our API
    return NextResponse.redirect(backup.url, { status: 302 });
  } catch (error) {
    console.error('Backup download error:', error);
    return NextResponse.json(
      { error: 'Failed to download backup' },
      { status: 500 }
    );
  }
}

// Delete a backup file
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
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

    const params = await context.params;
    const filename = decodeURIComponent(params.filename);
    
    // Security check: ensure filename is safe
    if (!filename.startsWith('backup-') || (!filename.endsWith('.json') && !filename.endsWith('.csv'))) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    // Find and delete the backup from Vercel Blob
    const { blobs } = await list({
      prefix: 'backups/',
      limit: 1000
    });
    
    const backup = blobs.find(blob => blob.pathname === `backups/${filename}`);
    
    if (!backup) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Delete the specific file
    await del(backup.url);
    
    // Also delete the corresponding file (JSON/CSV pair)
    const baseName = filename.replace(/\.(json|csv)$/, '');
    const pairedExtension = filename.endsWith('.json') ? '.csv' : '.json';
    const pairedFilename = `${baseName}${pairedExtension}`;
    
    const pairedBackup = blobs.find(blob => blob.pathname === `backups/${pairedFilename}`);
    if (pairedBackup) {
      await del(pairedBackup.url);
    }

    return NextResponse.json({ 
      message: 'Backup deleted successfully',
      filename 
    });
  } catch (error) {
    console.error('Backup deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    );
  }
}