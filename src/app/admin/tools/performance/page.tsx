'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Activity, TrendingUp, Database, Server, RefreshCw, AlertCircle,
  Zap, Clock, CheckCircle, XCircle
} from 'lucide-react';

interface PerformanceMetrics {
  apiCalls: number;
  avgResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  dbQueries?: number;
  avgDbTime?: number;
  activeConnections?: number;
  memoryUsage?: number;
}

interface EndpointMetric {
  endpoint: string;
  calls: number;
  avgTime: number;
  errors: number;
}

interface TimeSeriesData {
  time: string;
  responseTime: number;
  requests: number;
}

export default function PerformancePage() {
  const { data: session, status } = useSession();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointMetric[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchPerformanceData = useCallback(async () => {
    if (status !== 'authenticated') {
      return;
    }

    try {
      const response = await fetch('/api/admin/performance', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch performance data');
      }
      
      const data = await response.json();
      setMetrics(data.metrics);
      setEndpoints(data.endpoints);
      setTimeSeries(data.timeSeries);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
      console.error('Performance data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'loading') return; // Don't fetch while session is loading
    
    if (status === 'unauthenticated') {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [status, fetchPerformanceData]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {status === 'loading' ? 'Loading session...' : 'Loading performance data...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchPerformanceData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitor</h1>
          <p className="text-gray-600 mt-1">Real-time API and system performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
          <Button onClick={fetchPerformanceData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.apiCalls.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Total requests today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgResponseTime || 0}ms</div>
            <p className="text-xs text-muted-foreground">Across all endpoints</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics?.cacheHitRate || 0) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Cache effectiveness</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics?.errorRate || 0) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Failed requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Database Metrics (if available) */}
      {metrics?.dbQueries && (
        <>
          <h2 className="text-xl font-semibold">Database Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">DB Queries</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.dbQueries}</div>
                <p className="text-xs text-muted-foreground">Total queries today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Query Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgDbTime || 0}ms</div>
                <p className="text-xs text-muted-foreground">Database latency</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeConnections || 0}</div>
                <p className="text-xs text-muted-foreground">Current DB connections</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((metrics.memoryUsage || 0) * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">System memory</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Response Time Chart */}
      {timeSeries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Response Time Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#2563eb" 
                  name="Response Time (ms)"
                />
                <Line 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#10b981" 
                  name="Requests"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Endpoint Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Endpoint</th>
                  <th className="text-right p-2">Calls</th>
                  <th className="text-right p-2">Avg Time</th>
                  <th className="text-right p-2">Errors</th>
                  <th className="text-right p-2">Error Rate</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((endpoint) => {
                  const errorRate = endpoint.calls > 0 ? (endpoint.errors / endpoint.calls) * 100 : 0;
                  return (
                    <tr key={endpoint.endpoint} className="border-b">
                      <td className="p-2 font-mono text-xs">{endpoint.endpoint}</td>
                      <td className="text-right p-2">{endpoint.calls.toLocaleString()}</td>
                      <td className="text-right p-2">{endpoint.avgTime}ms</td>
                      <td className="text-right p-2">{endpoint.errors}</td>
                      <td className="text-right p-2">{errorRate.toFixed(0)}%</td>
                      <td className="text-center p-2">
                        {errorRate < 5 ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}