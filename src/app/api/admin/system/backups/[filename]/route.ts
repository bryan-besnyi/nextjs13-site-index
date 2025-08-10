import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import fs from 'fs';
import path from 'path';

// Download a backup file
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const filename = decodeURIComponent(params.filename);
    
    // Security check: ensure filename is safe
    if (!filename.startsWith('backup-') || (!filename.endsWith('.json') && !filename.endsWith('.csv'))) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    const backupDir = path.join(process.cwd(), 'backups');
    const filePath = path.join(backupDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read file content
    const fileContent = fs.readFileSync(filePath);
    const contentType = filename.endsWith('.json') ? 'application/json' : 'text/csv';
    
    // Return file as download
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileContent.length.toString(),
      },
    });
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
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const filename = decodeURIComponent(params.filename);
    
    // Security check: ensure filename is safe
    if (!filename.startsWith('backup-') || (!filename.endsWith('.json') && !filename.endsWith('.csv'))) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    const backupDir = path.join(process.cwd(), 'backups');
    const filePath = path.join(backupDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    
    // If deleting a JSON file, also try to delete the corresponding CSV file
    if (filename.endsWith('.json')) {
      const csvFilename = filename.replace('.json', '.csv');
      const csvFilePath = path.join(backupDir, csvFilename);
      if (fs.existsSync(csvFilePath)) {
        fs.unlinkSync(csvFilePath);
      }
    }
    
    // If deleting a CSV file, also try to delete the corresponding JSON file
    if (filename.endsWith('.csv')) {
      const jsonFilename = filename.replace('.csv', '.json');
      const jsonFilePath = path.join(backupDir, jsonFilename);
      if (fs.existsSync(jsonFilePath)) {
        fs.unlinkSync(jsonFilePath);
      }
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