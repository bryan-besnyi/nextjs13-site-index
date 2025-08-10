'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Activity, Users, TrendingUp, Clock, Download, RefreshCw, 
  AlertCircle, Calendar, BarChart3
} from 'lucide-react';

interface UsageOverview {
  totalCalls: number;
  uniqueUsers: number;
  avgCallsPerDay: number;
  peakHour: number;
}

interface CampusMetric {
  campus: string;
  calls: number;
  growth: number;
}

interface EndpointMetric {
  endpoint: string;
  calls: number;
  avgTime: number;
}

interface TimeSeriesData {
  date: string;
  calls: number;
}

export default function UsageStatsPage() {
  const [overview, setOverview] = useState<UsageOverview | null>(null);
  const [campusMetrics, setCampusMetrics] = useState<CampusMetric[]>([]);
  const [popularEndpoints, setPopularEndpoints] = useState<EndpointMetric[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/usage?range=${dateRange}`);
      if (!response.ok) throw new Error('Failed to fetch usage data');
      
      const data = await response.json();
      setOverview(data.overview);
      setCampusMetrics(data.campusMetrics);
      setPopularEndpoints(data.popularEndpoints);
      setTimeSeriesData(data.timeSeriesData.daily);
      setError(null);
    } catch (err) {
      setError('Failed to load usage statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, [dateRange]); // fetchUsageData is stable, no need to include

  const exportToCSV = () => {
    const headers = ['Date', 'API Calls'];
    const rows = timeSeriesData.map(d => [d.date, d.calls]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-stats-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading usage statistics...</p>
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
          <Button onClick={fetchUsageData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usage Statistics</h1>
          <p className="text-gray-600 mt-1">API usage analytics and system utilization metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={dateRange === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDateRange('week')}
            >
              7 Days
            </Button>
            <Button
              variant={dateRange === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDateRange('month')}
            >
              30 Days
            </Button>
            <Button
              variant={dateRange === 'year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDateRange('year')}
            >
              1 Year
            </Button>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchUsageData} variant="outline" size="sm" aria-label="Refresh data">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.totalCalls.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange === 'week' ? 'Last 7 days' : dateRange === 'month' ? 'Last 30 days' : 'Last year'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.uniqueUsers.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Active API consumers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Calls/Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.avgCallsPerDay.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Daily average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.peakHour ? `${overview.peakHour % 12 || 12}:00 ${overview.peakHour >= 12 ? 'PM' : 'AM'}` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">Busiest time of day</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value: number) => value.toLocaleString()}
              />
              <Line 
                type="monotone" 
                dataKey="calls" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={false}
                name="API Calls"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campus Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Campus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={campusMetrics}
                  dataKey="calls"
                  nameKey="campus"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ campus, calls }) => `${campus}: ${calls.toLocaleString()}`}
                >
                  {campusMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Campus Growth Table */}
            <div className="mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Campus</th>
                    <th className="text-right p-2">Calls</th>
                    <th className="text-right p-2">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {campusMetrics.map((campus) => (
                    <tr key={campus.campus} className="border-b">
                      <td className="p-2">{campus.campus}</td>
                      <td className="text-right p-2">{campus.calls.toLocaleString()}</td>
                      <td className="text-right p-2">
                        <span className={campus.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {campus.growth >= 0 ? '+' : ''}{(campus.growth * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Popular Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularEndpoints}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="endpoint" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Bar dataKey="calls" fill="#2563eb" name="API Calls" />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Endpoint Performance Table */}
            <div className="mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Endpoint</th>
                    <th className="text-right p-2">Calls</th>
                    <th className="text-right p-2">Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {popularEndpoints.slice(0, 5).map((endpoint) => (
                    <tr key={endpoint.endpoint} className="border-b">
                      <td className="p-2 font-mono text-xs">{endpoint.endpoint}</td>
                      <td className="text-right p-2">{endpoint.calls.toLocaleString()}</td>
                      <td className="text-right p-2">{endpoint.avgTime}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}