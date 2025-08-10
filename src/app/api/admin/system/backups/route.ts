import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all backup files and statistics
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backupDir = path.join(process.cwd(), 'backups');
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      return NextResponse.json({ 
        backups: [], 
        stats: { totalBackups: 0, totalSize: 0, lastBackup: null, oldestBackup: null, avgSize: 0 }
      });
    }

    // Read all backup files
    const files = fs.readdirSync(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('backup-') && (file.endsWith('.json') || file.endsWith('.csv')))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const type = file.endsWith('.json') ? 'json' : 'csv';
        
        let records = undefined;
        if (type === 'json') {
          try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            records = content.totalRecords || content.indexItems?.length || 0;
          } catch (e) {
            // If we can't parse, just leave records undefined
          }
        }

        return {
          name: file,
          size: stats.size,
          date: stats.mtime.toISOString(),
          type,
          records
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

    return NextResponse.json({ backups: backupFiles, stats });
  } catch (error) {
    console.error('Backups fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backup information' },
      { status: 500 }
    );
  }
}

// Create a new backup
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16); // YYYY-MM-DDTHH-MM
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Get all data
    const indexItems = await prisma.indexitem.findMany({ orderBy: { id: 'asc' } });
    
    const data = {
      indexItems,
      backupDate: now.toISOString(),
      totalRecords: indexItems.length,
      createdBy: session.user.email
    };
    
    // Save JSON backup
    const jsonFile = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
    
    // Save CSV backup
    const csvFile = path.join(backupDir, `backup-${timestamp}.csv`);
    const csvContent = [
      'id,title,letter,url,campus,createdAt,updatedAt',
      ...indexItems.map(item => 
        `${item.id},"${item.title.replace(/"/g, '""')}",${item.letter},"${item.url}",${item.campus},${item.createdAt},${item.updatedAt}`
      )
    ].join('\n');
    fs.writeFileSync(csvFile, csvContent);
    
    // Clean up old backups (keep last 7 days)
    const files = fs.readdirSync(backupDir);
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    files
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .forEach(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          // Remove both JSON and CSV files
          fs.unlinkSync(filePath);
          const csvPath = filePath.replace('.json', '.csv');
          if (fs.existsSync(csvPath)) {
            fs.unlinkSync(csvPath);
          }
        }
      });

    return NextResponse.json({ 
      message: 'Backup created successfully',
      filename: `backup-${timestamp}`,
      records: indexItems.length,
      size: {
        json: fs.statSync(jsonFile).size,
        csv: fs.statSync(csvFile).size
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