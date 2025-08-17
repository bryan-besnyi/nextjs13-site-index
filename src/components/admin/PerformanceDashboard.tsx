'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Gauge
} from 'lucide-react';

interface PerformanceMetric {
  timestamp: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  cacheHit: boolean;
  dbQueryTime?: number;
  resultCount?: number;
}

interface CacheStats {
  legacyStats?: {
    totalKeys: number;
    hitRate: number;
    totalRequests: number;
    cachedRequests: number;
  };
  enhancedStats: {
    inMemoryEntries: number;
    totalHits: number;
    averageHitsPerEntry: number;
  };
  totalCacheEntries: number;
  recommendation: string;
  performanceTarget: string;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWarming, setIsWarming] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [metricsRes, cacheRes] = await Promise.all([
        fetch('/api/admin/performance', {
          credentials: 'include'
        }),
        fetch('/api/admin/cache/warmup', {
          credentials: 'include'
        })
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics || []);
      }

      if (cacheRes.ok) {
        const cacheData = await cacheRes.json();
        setCacheStats(cacheData);
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const warmCache = async () => {
    try {
      setIsWarming(true);
      const response = await fetch('/api/admin/cache/warmup', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        await fetchData(); // Refresh data after warming
      }
    } catch (error) {
      console.error('Failed to warm cache:', error);
    } finally {
      setIsWarming(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate performance metrics
  const recentMetrics = metrics.slice(-20); // Last 20 requests
  const avgResponseTime = recentMetrics.length > 0 
    ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length 
    : 0;
  const cacheHitRate = recentMetrics.length > 0 
    ? (recentMetrics.filter(m => m.cacheHit).length / recentMetrics.length) * 100 
    : 0;
  const slowRequests = recentMetrics.filter(m => m.responseTime > 100).length;

  const getPerformanceStatus = () => {
    if (avgResponseTime < 50) return { status: 'excellent', color: 'green', icon: CheckCircle };
    if (avgResponseTime < 100) return { status: 'good', color: 'blue', icon: TrendingUp };
    if (avgResponseTime < 200) return { status: 'fair', color: 'yellow', icon: AlertTriangle };
    return { status: 'poor', color: 'red', icon: AlertTriangle };
  };

  const performanceStatus = getPerformanceStatus();
  const StatusIcon = performanceStatus.icon;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-gray-600">Monitor API performance and cache efficiency</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={warmCache} 
            disabled={isWarming}
            variant="outline"
            size="sm"
          >
            {isWarming ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Warm Cache
          </Button>
          <Button 
            onClick={fetchData} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Performance Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <StatusIcon className={`h-4 w-4 text-${performanceStatus.color}-600`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgResponseTime.toFixed(1)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Target: &lt; 100ms
            </p>
            <Badge 
              variant={avgResponseTime < 100 ? "default" : "destructive"}
              className="mt-2"
            >
              {performanceStatus.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheHitRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Target: &gt; 95%
            </p>
            <Badge 
              variant={cacheHitRate > 95 ? "default" : "secondary"}
              className="mt-2"
            >
              {cacheHitRate > 95 ? 'Excellent' : 'Needs improvement'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Entries</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cacheStats?.totalCacheEntries || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total cached items
            </p>
            <div className="text-xs text-gray-500 mt-1">
              Memory: {cacheStats?.enhancedStats?.inMemoryEntries || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Requests</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{slowRequests}</div>
            <p className="text-xs text-muted-foreground">
              &gt; 100ms (last 20)
            </p>
            <Badge 
              variant={slowRequests === 0 ? "default" : "destructive"}
              className="mt-2"
            >
              {slowRequests === 0 ? 'All fast' : `${slowRequests} slow`}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Cache Statistics */}
      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Cache Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Redis Cache</h4>
                <div className="text-sm text-gray-600">
                  <div>Total Keys: {cacheStats.legacyStats?.totalKeys || 0}</div>
                  <div>Hit Rate: {cacheStats.legacyStats?.hitRate?.toFixed(1) || 0}%</div>
                  <div>Requests: {cacheStats.legacyStats?.totalRequests || 0}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Memory Cache</h4>
                <div className="text-sm text-gray-600">
                  <div>Entries: {cacheStats.enhancedStats.inMemoryEntries}</div>
                  <div>Total Hits: {cacheStats.enhancedStats.totalHits}</div>
                  <div>Avg Hits/Entry: {cacheStats.enhancedStats.averageHitsPerEntry.toFixed(1)}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Recommendation</h4>
                <div className="text-sm text-gray-600">
                  {cacheStats.recommendation}
                </div>
                <div className="text-xs text-blue-600 font-medium">
                  Target: {cacheStats.performanceTarget}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent API Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentMetrics.slice(-10).map((metric, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 border rounded text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{metric.method}</Badge>
                  <span className="font-mono text-xs">{metric.endpoint}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${
                    metric.responseTime < 100 ? 'text-green-600' : 
                    metric.responseTime < 200 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metric.responseTime}ms
                  </span>
                  {metric.cacheHit && (
                    <Badge variant="secondary" className="text-xs">Cache Hit</Badge>
                  )}
                  <Badge 
                    variant={metric.statusCode < 300 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {metric.statusCode}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}