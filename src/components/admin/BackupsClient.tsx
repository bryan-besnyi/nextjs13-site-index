'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Database, Download, RefreshCw, AlertCircle, CheckCircle, 
  Calendar, HardDrive, Clock, Play, Trash2, FileText
} from 'lucide-react';

interface BackupFile {
  name: string;
  size: number;
  date: string;
  type: 'json' | 'csv';
  records?: number;
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup: string | null;
  oldestBackup: string | null;
  avgSize: number;
}

export default function BackupsClient() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      
      // Add cache busting for preview environments
      const isPreview = typeof window !== 'undefined' && 
        (window.location.hostname.includes('vercel.app') || 
         process.env.NODE_ENV === 'development');
      
      const url = isPreview 
        ? `/api/admin/system/backups?_t=${Date.now()}`
        : '/api/admin/system/backups';
      
      const response = await fetch(url, {
        credentials: 'include',
        cache: 'no-cache' // Prevent caching issues
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch backups');
      }
      
      const data = await response.json();
      
      // Debug logging to help identify date issues
      console.log('Backup data received:', data.backups?.slice(0, 2)); // Log first 2 items
      console.log('Stats received:', data.stats);
      
      data.backups?.forEach((backup: BackupFile, index: number) => {
        if (index < 2) { // Only log first 2 items
          console.log(`Backup ${index}: name=${backup.name}, date=${backup.date}, parsed=${new Date(backup.date)}, year=${new Date(backup.date).getFullYear()}`);
        }
        if (index < 3) { // Only log first 3 for debugging
          const parsedDate = new Date(backup.date);
          console.log(`Backup ${index}:`, {
            name: backup.name,
            rawDate: backup.date,
            parsedDate: parsedDate,
            year: parsedDate.getFullYear(),
            isValidDate: !isNaN(parsedDate.getTime()),
            formattedDate: parsedDate.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              timeZoneName: 'short'
            })
          });
        }
      });
      
      setBackups(data.backups);
      setStats(data.stats);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load backup information';
      setError(errorMessage);
      console.error('Backup fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const createBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const response = await fetch('/api/admin/system/backups', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create backup');
      }
      
      // Refresh the backup list
      await fetchBackups();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create backup';
      setError(errorMessage);
      console.error('Backup creation error:', err);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/admin/system/backups/${encodeURIComponent(filename)}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to download backup');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Failed to download ${filename}`);
      console.error(err);
    }
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(filename);
      const response = await fetch(`/api/admin/system/backups/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to delete backup');
      
      // Refresh the backup list
      await fetchBackups();
    } catch (err) {
      setError(`Failed to delete ${filename}`);
      console.error(err);
    } finally {
      setIsDeleting(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Ensure we have a valid date
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      // Use explicit locale and options for consistent formatting
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', dateString);
      return 'Invalid Date';
    }
  };

  const getBackupAge = (dateString: string) => {
    try {
      const now = new Date();
      const backupDate = new Date(dateString);
      
      // Ensure we have valid dates
      if (isNaN(backupDate.getTime())) {
        return 'Unknown age';
      }
      
      const diffMs = now.getTime() - backupDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return 'Less than an hour ago';
    } catch (error) {
      console.error('Date age calculation error:', error, 'Input:', dateString);
      return 'Unknown age';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading backup information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchBackups}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Database Backups</h1>
          <p className="text-gray-600 mt-1">Manage and download database backups</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={createBackup} 
            disabled={isCreatingBackup}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCreatingBackup ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Create Backup
          </Button>
          <Button onClick={fetchBackups} variant="outline" size="sm" aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBackups}</div>
              <p className="text-xs text-muted-foreground">Available backup files</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
              <p className="text-xs text-muted-foreground">Storage used by backups</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastBackup ? getBackupAge(stats.lastBackup) : 'None'}
              </div>
              <p className="text-xs text-muted-foreground">Most recent backup</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Size</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(stats.avgSize)}</div>
              <p className="text-xs text-muted-foreground">Per backup file</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backup Files */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Files</CardTitle>
          <p className="text-sm text-muted-foreground">
            All available database backups. JSON files contain complete data, CSV files are for spreadsheet import.
          </p>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No backups found</p>
              <Button onClick={createBackup} className="mt-4">
                Create First Backup
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Filename</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Size</th>
                    <th className="text-left p-3">Created</th>
                    <th className="text-left p-3">Age</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups
                    .sort((a, b) => {
                      const dateA = new Date(a.date);
                      const dateB = new Date(b.date);
                      // Handle invalid dates by putting them at the end
                      if (isNaN(dateA.getTime())) return 1;
                      if (isNaN(dateB.getTime())) return -1;
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map((backup) => (
                    <tr key={backup.name} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-sm">{backup.name}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          backup.type === 'json' 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {backup.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">{formatFileSize(backup.size)}</td>
                      <td className="p-3">{formatDate(backup.date)}</td>
                      <td className="p-3 text-sm text-gray-600">{getBackupAge(backup.date)}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => downloadBackup(backup.name)}
                            variant="outline"
                            size="sm"
                            aria-label={`Download ${backup.name}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => deleteBackup(backup.name)}
                            variant="outline"
                            size="sm"
                            disabled={isDeleting === backup.name}
                            className="text-red-600 hover:text-red-700"
                            aria-label={`Delete ${backup.name}`}
                          >
                            {isDeleting === backup.name ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Information */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Automated Backups
              </h4>
              <p className="text-sm text-gray-600">
                Backups are automatically created every 30 minutes via scheduled job.
                Old backups are cleaned up after 7 days to save storage space.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <Database className="h-4 w-4 text-blue-500 mr-2" />
                File Formats
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>JSON:</strong> Complete database export with full structure</p>
                <p><strong>CSV:</strong> Simplified format for spreadsheet applications</p>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
              Best Practices
            </h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Download backups regularly to external storage for disaster recovery</li>
              <li>Test backup restoration process periodically</li>
              <li>Keep at least 3 recent backups available at all times</li>
              <li>Monitor backup creation and verify data integrity</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}