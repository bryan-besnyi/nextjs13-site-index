'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Trash2,
  RefreshCw,
  Bell,
  BellOff,
  TrendingUp,
  Activity
} from 'lucide-react';
import { PerformanceAlert } from '@/types';
import toast from 'react-hot-toast';

interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  acknowledged: number;
  resolved: number;
}

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    acknowledged: 0,
    resolved: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info' | 'unresolved'>('all');

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if we're in preview mode
      const isPreview = typeof window !== 'undefined' && 
        (window.location.hostname.includes('vercel.app') || 
         process.env.NODE_ENV === 'development');

      const [alertsResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/alerts?action=recent&limit=50', {
          credentials: 'include'
        }),
        fetch('/api/admin/alerts?action=stats', {
          credentials: 'include'
        })
      ]);

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.alerts || []);
      } else if (isPreview && (alertsResponse.status === 401 || alertsResponse.status === 500)) {
        // In preview mode, show mock data when API fails
        console.warn('Using mock alerts data for preview environment');
        setAlerts([
          {
            id: 'mock-1',
            type: 'response_time',
            severity: 'critical',
            message: 'High response time detected on /api/indexItems',
            endpoint: '/api/indexItems',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
            acknowledged: false,
            resolvedAt: undefined,
            details: { current: 2500, threshold: 1000, unit: 'ms' }
          },
          {
            id: 'mock-2', 
            type: 'error_rate',
            severity: 'warning',
            message: 'Elevated error rate on admin endpoints',
            endpoint: '/api/admin/*',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
            acknowledged: true,
            resolvedAt: undefined,
            details: { current: 5.2, threshold: 5.0, unit: '%' }
          },
          {
            id: 'mock-3',
            type: 'cache_performance',
            severity: 'info', 
            message: 'Cache miss rate above normal',
            endpoint: '/api/indexItems',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
            acknowledged: false,
            resolvedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() // resolved 10 min ago
          },
          {
            id: 'mock-4',
            type: 'memory_usage',
            severity: 'critical',
            message: 'Memory usage critical threshold exceeded',
            endpoint: undefined,
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago  
            acknowledged: true,
            resolvedAt: undefined,
            details: { current: 95.8, threshold: 90.0, unit: '%' }
          }
        ]);
        toast.success('Preview mode: Showing sample alerts data');
      } else {
        console.error('Failed to fetch alerts:', alertsResponse.status, alertsResponse.statusText);
        toast.error('Failed to load alerts - check authentication');
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || {
          total: 0,
          critical: 0,
          warning: 0,
          info: 0,
          acknowledged: 0,
          resolved: 0
        });
      } else if (isPreview && (statsResponse.status === 401 || statsResponse.status === 500)) {
        // Mock stats for preview
        setStats({
          total: 4,
          critical: 2,
          warning: 1,
          info: 1,
          acknowledged: 2,
          resolved: 1
        });
      } else {
        console.error('Failed to fetch stats:', statsResponse.status, statsResponse.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve') => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token');
      const csrfData = await csrfResponse.json();

      const response = await fetch('/api/admin/alerts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          [csrfData.headerName]: csrfData.token
        },
        body: JSON.stringify({ action, alertId })
      });

      if (response.ok) {
        toast.success(`Alert ${action}d successfully`);
        fetchAlerts(); // Refresh the list
      } else {
        throw new Error(`Failed to ${action} alert`);
      }
    } catch (error) {
      console.error(`Alert ${action} failed:`, error);
      toast.error(`Failed to ${action} alert`);
    }
  };

  const handleCleanupOldAlerts = async () => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token');
      const csrfData = await csrfResponse.json();

      const response = await fetch('/api/admin/alerts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          [csrfData.headerName]: csrfData.token
        },
        body: JSON.stringify({ action: 'cleanup', hoursOld: 24 })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        fetchAlerts();
      } else {
        throw new Error('Failed to cleanup alerts');
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast.error('Failed to cleanup old alerts');
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'outline'; // Use outline for warnings with custom styling
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'critical':
        return alert.severity === 'critical';
      case 'warning':
        return alert.severity === 'warning';
      case 'info':
        return alert.severity === 'info';
      case 'unresolved':
        return !alert.resolvedAt;
      default:
        return true;
    }
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRelativeTime = (timestamp: string) => {
    const now = Date.now();
    const alertTime = new Date(timestamp).getTime();
    const diffMinutes = Math.floor((now - alertTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Alert Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="flex items-center p-4">
            <Activity className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Warning</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <Info className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Info</p>
              <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <BellOff className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Acknowledged</p>
              <p className="text-2xl font-bold text-green-600">{stats.acknowledged}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Performance Alerts
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAlerts}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanupOldAlerts}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Cleanup Old
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['all', 'critical', 'warning', 'info', 'unresolved'].map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterOption as any)}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                {filterOption !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({filterOption === 'unresolved' 
                      ? alerts.filter(a => !a.resolvedAt).length
                      : stats[filterOption as keyof AlertStats]
                    })
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Alerts List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading alerts...</p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {filter === 'all' ? 'No alerts found' : `No ${filter} alerts found`}
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${
                    alert.severity === 'critical' 
                      ? 'border-red-200 bg-red-50' 
                      : alert.severity === 'warning'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-blue-200 bg-blue-50'
                  } ${alert.resolvedAt ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={getAlertBadgeVariant(alert.severity)}
                            className={alert.severity === 'warning' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : ''}
                          >
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {alert.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="secondary">
                              ACKNOWLEDGED
                            </Badge>
                          )}
                          {alert.resolvedAt && (
                            <Badge variant="secondary">
                              RESOLVED
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-sm mb-1">{alert.message}</h4>
                        {alert.endpoint && (
                          <p className="text-xs text-muted-foreground mb-1">
                            Endpoint: {alert.endpoint}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getRelativeTime(alert.timestamp)}
                          </span>
                          <span title={formatTimestamp(alert.timestamp)}>
                            {formatTimestamp(alert.timestamp)}
                          </span>
                        </div>
                        {alert.details && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                              View Details
                            </summary>
                            <pre className="text-xs mt-1 p-2 bg-white/50 rounded border overflow-x-auto">
                              {JSON.stringify(alert.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>

                    {/* Alert Actions */}
                    {!alert.resolvedAt && (
                      <div className="flex gap-2">
                        {!alert.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                          >
                            <BellOff className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlertAction(alert.id, 'resolve')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}