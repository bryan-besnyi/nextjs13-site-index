'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  ExternalLink,
  Download
} from 'lucide-react';

interface LinkCheckSummary {
  total: number;
  active: number;
  dead: number;
  redirects: number;
  timeouts: number;
  errors: number;
  lastScanDate?: string;
}

interface DeadLink {
  id: number;
  title: string;
  url: string;
  campus: string;
  letter: string;
  status: string;
  error?: string;
  lastChecked?: string;
}

export default function LinkHealthDashboard() {
  const [summary, setSummary] = useState<LinkCheckSummary | null>(null);
  const [deadLinks, setDeadLinks] = useState<DeadLink[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchLinkStatus();
  }, []);

  const fetchLinkStatus = async () => {
    try {
      const response = await fetch('/api/admin/link-check?action=status');
      const data = await response.json();
      
      if (data.summary) {
        setSummary(data.summary);
      }
      
      if (data.hasCachedData) {
        fetchDeadLinks();
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch link status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeadLinks = async () => {
    try {
      const response = await fetch('/api/admin/link-check?action=dead-links');
      const data = await response.json();
      setDeadLinks(data.deadLinks || []);
    } catch (error) {
      console.error('Failed to fetch dead links:', error);
    }
  };

  const startFullScan = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/admin/link-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full-scan' })
      });
      
      if (response.ok) {
        // Poll for results every 30 seconds
        const pollInterval = setInterval(async () => {
          await fetchLinkStatus();
          if (summary?.lastScanDate) {
            const scanDate = new Date(summary.lastScanDate);
            if (scanDate > lastRefresh) {
              clearInterval(pollInterval);
              setIsScanning(false);
            }
          }
        }, 30000);

        // Stop polling after 15 minutes max
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsScanning(false);
        }, 15 * 60 * 1000);
      }
    } catch (error) {
      console.error('Failed to start scan:', error);
      setIsScanning(false);
    }
  };

  const exportDeadLinks = () => {
    const csvContent = [
      'Title,URL,Campus,Letter,Status,Error',
      ...deadLinks.map(link => 
        `"${link.title}","${link.url}","${link.campus}","${link.letter}","${link.status}","${link.error || ''}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dead-links-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading link health data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthScore = summary ? 
    Math.round((summary.active / summary.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {summary?.active || 0}
                </p>
                <p className="text-sm text-muted-foreground">Active Links</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {summary?.dead || 0}
                </p>
                <p className="text-sm text-muted-foreground">Dead Links</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {(summary?.redirects || 0) + (summary?.errors || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {healthScore}%
                </p>
                <p className="text-sm text-muted-foreground">Health Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Link Health Overview</CardTitle>
            <div className="flex space-x-2">
              <Button
                onClick={fetchLinkStatus}
                variant="outline"
                size="sm"
                disabled={isScanning}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={startFullScan}
                disabled={isScanning}
                size="sm"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  'Start Full Scan'
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {summary ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Overall Health</span>
                <span className="font-semibold">{healthScore}%</span>
              </div>
              <Progress value={healthScore} className="h-3" />
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active: {summary.active}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="destructive">
                    Dead: {summary.dead}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                    Redirects: {summary.redirects}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-orange-500 text-orange-700">
                    Timeouts: {summary.timeouts}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-red-500 text-red-700">
                    Errors: {summary.errors}
                  </Badge>
                </div>
              </div>

              {summary.lastScanDate && (
                <p className="text-sm text-muted-foreground">
                  Last scan: {new Date(summary.lastScanDate).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No link check data available</p>
              <Button onClick={startFullScan} disabled={isScanning}>
                Run First Scan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dead Links Table */}
      {deadLinks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dead Links ({deadLinks.length})</CardTitle>
              <Button onClick={exportDeadLinks} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {deadLinks.slice(0, 50).map((link) => (
                <div 
                  key={link.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="font-medium truncate">{link.title}</span>
                      <Badge variant="outline" className="flex-shrink-0">
                        {link.campus} - {link.letter}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {link.url}
                    </p>
                    {link.error && (
                      <p className="text-xs text-red-600 mt-1">{link.error}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {deadLinks.length > 50 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  ... and {deadLinks.length - 50} more dead links
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}