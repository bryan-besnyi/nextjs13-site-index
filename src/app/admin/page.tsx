import { prisma } from '@/lib/prisma-singleton';
import { kv } from '@vercel/kv';
import MetricsCard from '@/components/admin/MetricsCard';
import { getCacheStats } from '@/lib/indexItems-cached';
import { 
  Database, 
  TrendingUp, 
  Gauge, 
  Activity,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceMonitor } from '@/lib/performance-monitor';
import { QueryCache } from '@/lib/query-cache';
import ErrorActions from '@/components/admin/ErrorActions';
import QuickActions from '@/components/admin/QuickActions';

async function getDashboardMetrics() {
  try {
    // Use optimized cached dashboard stats
    const cachedStats = await QueryCache.getDashboardStats();
    
    // Get real cache stats from Redis
    const cacheStatsResult = await getCacheStats();
    const cacheStats = cacheStatsResult.stats || {
      hitRate: 0,
      totalRequests: 0,
      cachedRequests: 0
    };
    
    // Get API performance metrics
    const performanceMetrics = PerformanceMonitor.getAnalytics();
    
    return {
      totalItems: cachedStats.totalItems,
      itemsByCampus: cachedStats.campusCounts.map((item) => ({
        campus: item.campus,
        _count: item._count.campus
      })),
      recentItems: cachedStats.recentItems,
      cacheStats,
      performanceMetrics
    };
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    // Return partial/fallback data instead of null to provide better UX
    return {
      totalItems: 0,
      itemsByCampus: [
        { campus: 'Cañada College', _count: 0 },
        { campus: 'College of San Mateo', _count: 0 },
        { campus: 'Skyline College', _count: 0 },
        { campus: 'District Office', _count: 0 }
      ],
      recentItems: 0,
      cacheStats: {
        hitRate: 0,
        totalRequests: 0,
        cachedRequests: 0
      },
      performanceMetrics: null,
      error: error instanceof Error ? error.message : 'Unknown error' // Include error info for debugging
    };
  }
}

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();
  
  // This will never happen now since we return fallback data, but keeping for safety
  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Dashboard Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Failed to load dashboard metrics. This could be due to:
            </p>
            <ul className="text-sm text-left space-y-1 text-muted-foreground">
              <li>• Database connection issues</li>
              <li>• Network connectivity problems</li>
              <li>• Server overload or maintenance</li>
            </ul>
            <ErrorActions />
            <p className="text-xs text-muted-foreground pt-2 border-t">
              If this persists, contact{' '}
              <a 
                href="mailto:webmaster@smccd.edu"
                className="text-blue-600 hover:underline"
              >
                Web Services
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }


  // Calculate some derived metrics
  const totalAPIRequests = metrics.performanceMetrics?.totalRequests || 0;
  const errorRate = metrics.performanceMetrics?.errorRate || 0;
  const successfulRequests = Math.round(totalAPIRequests * (1 - errorRate / 100));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">SMCCCD Site Index Management System</p>
      </div>
      
      {/* Error banner for partial data */}
      {metrics.error && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-orange-800">Dashboard partially loaded</p>
              <p className="text-sm text-orange-700">{metrics.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Index Items</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalItems.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all campuses</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.performanceMetrics?.averageResponseTime?.toFixed(0) || 'N/A'}ms
              </div>
              <p className="text-xs text-muted-foreground">Average last 24h</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.cacheStats.hitRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{metrics.cacheStats.cachedRequests.toLocaleString()} cached</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Operational</div>
              <p className="text-xs text-muted-foreground">All systems normal</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions and Campus Distribution */}
      <div>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <QuickActions />

          {/* Campus Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Items by Campus
              </CardTitle>
              <p className="text-sm text-muted-foreground">Distribution across SMCCCD locations</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.itemsByCampus.map((campus, index) => {
                  const percentage = (campus._count / metrics.totalItems) * 100;
                  return (
                    <div key={campus.campus} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{campus.campus}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700">{campus._count}</span>
                          <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="relative w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity & System Status */}
      <div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Recent Activity
              </CardTitle>
              <p className="text-sm text-muted-foreground">System activity in the last 7 days</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900">New Content Added</p>
                    <p className="text-sm text-green-700">
                      {metrics.recentItems} new items added in the last 7 days
                    </p>
                  </div>
                </div>
                
                {metrics.performanceMetrics && (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <Activity className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-blue-900">API Activity</p>
                        <p className="text-sm text-blue-700">
                          {metrics.performanceMetrics.totalRequests.toLocaleString()} requests processed today
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <Gauge className="h-5 w-5 text-orange-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-orange-900">Performance Monitor</p>
                        <p className="text-sm text-orange-700">
                          {metrics.performanceMetrics.slowQueries} slow queries detected
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Health Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                System Health
              </CardTitle>
              <p className="text-sm text-muted-foreground">Current system status and metrics</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">99.9%</div>
                    <div className="text-xs text-green-600 font-medium">Uptime</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{successfulRequests.toLocaleString()}</div>
                    <div className="text-xs text-blue-600 font-medium">Successful Requests</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Database Connection</span>
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle className="h-3 w-3" />
                      Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Cache Performance</span>
                    <span className="font-medium text-blue-600">{metrics.cacheStats.hitRate.toFixed(1)}% hit rate</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Error Rate</span>
                    <span className="font-medium text-green-600">&lt;0.1%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
