'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Database,
  HardDrive,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Server,
  Wifi,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface HealthStatus {
  status: 'pass' | 'warn' | 'fail';
  componentType: string;
  observedValue?: number;
  observedUnit?: string;
  time: string;
}

interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  version: string;
  releaseId: string;
  description: string;
  checks: {
    [key: string]: HealthStatus[];
  };
  uptime: number;
  responseTime: number;
}

interface SystemMetrics {
  database: {
    status: 'healthy' | 'warning' | 'error';
    connections: number;
    responseTime: number;
    uptime: string;
  };
  cache: {
    status: 'healthy' | 'warning' | 'error';
    hitRate: number;
    memory: number;
    keys: number;
  };
  api: {
    status: 'healthy' | 'warning' | 'error';
    requests24h: number;
    avgResponseTime: number;
    errorRate: number;
  };
  system: {
    status: 'healthy' | 'warning' | 'error';
    memory: number;
    cpu: number;
    disk: number;
  };
}

export default function SystemHealthClient() {
  const [healthData, setHealthData] = useState<HealthCheck | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      toast.error('Failed to fetch health data');
    }
  };

  const fetchMetrics = async () => {
    try {
      // Simulate fetching system metrics
      const mockMetrics: SystemMetrics = {
        database: {
          status: 'healthy',
          connections: 12,
          responseTime: 45,
          uptime: '7d 14h'
        },
        cache: {
          status: 'healthy',
          hitRate: 87.5,
          memory: 256,
          keys: 1420
        },
        api: {
          status: 'healthy',
          requests24h: 15420,
          avgResponseTime: 120,
          errorRate: 0.02
        },
        system: {
          status: 'healthy',
          memory: 68,
          cpu: 35,
          disk: 45
        }
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchHealthData(), fetchMetrics()]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshData]);

  const getStatusIcon = (
    status: 'pass' | 'warn' | 'fail' | 'healthy' | 'warning' | 'error'
  ) => {
    switch (status) {
      case 'pass':
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warn':
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (
    status: 'pass' | 'warn' | 'fail' | 'healthy' | 'warning' | 'error'
  ) => {
    switch (status) {
      case 'pass':
      case 'healthy':
        return 'border-green-200 bg-green-50';
      case 'warn':
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'fail':
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={refreshData} disabled={isLoading} variant="outline">
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh (30s)
            </label>
          </div>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Overall Health Status */}
      {healthData && (
        <Card className={getStatusColor(healthData.status)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(healthData.status)}
              Overall System Status: {healthData.status.toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Version</p>
                <p className="text-lg">{healthData.version}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Uptime</p>
                <p className="text-lg">{formatUptime(healthData.uptime)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Response Time</p>
                <p className="text-lg">{healthData.responseTime}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Metrics */}
      {metrics && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Database */}
          <Card className={getStatusColor(metrics.database.status)}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database
                </div>
                {getStatusIcon(metrics.database.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Connections:</span>
                <span>{metrics.database.connections}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Response:</span>
                <span>{metrics.database.responseTime}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Uptime:</span>
                <span>{metrics.database.uptime}</span>
              </div>
            </CardContent>
          </Card>

          {/* Cache */}
          <Card className={getStatusColor(metrics.cache.status)}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Cache
                </div>
                {getStatusIcon(metrics.cache.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hit Rate:</span>
                <span>{metrics.cache.hitRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Memory:</span>
                <span>{metrics.cache.memory}MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Keys:</span>
                <span>{metrics.cache.keys.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* API */}
          <Card className={getStatusColor(metrics.api.status)}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  API
                </div>
                {getStatusIcon(metrics.api.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Requests (24h):</span>
                <span>{metrics.api.requests24h.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg Response:</span>
                <span>{metrics.api.avgResponseTime}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Error Rate:</span>
                <span>{(metrics.api.errorRate * 100).toFixed(2)}%</span>
              </div>
            </CardContent>
          </Card>

          {/* System */}
          <Card className={getStatusColor(metrics.system.status)}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  System
                </div>
                {getStatusIcon(metrics.system.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory:</span>
                <span>{metrics.system.memory}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>CPU:</span>
                <span>{metrics.system.cpu}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Disk:</span>
                <span>{metrics.system.disk}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Health Checks */}
      {healthData?.checks && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Health Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(healthData.checks).map(([component, checks]) => (
                <div key={component} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 capitalize">
                    {component.replace(/([A-Z])/g, ' $1')}
                  </h4>
                  <div className="space-y-2">
                    {checks.map((check, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {getStatusIcon(check.status)}
                          <span>{check.componentType}</span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          {check.observedValue && (
                            <span>
                              {check.observedValue} {check.observedUnit}
                            </span>
                          )}
                          <span>
                            {new Date(check.time).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !healthData && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading system health data...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
