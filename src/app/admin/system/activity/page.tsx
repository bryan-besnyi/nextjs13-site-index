'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Activity, Search, Filter, Download, RefreshCw, 
  Clock, User, Globe, Shield, FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLogEntry {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  timestamp: string;
}

export default function ActivityTrailPage() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    userEmail: '',
    startDate: '',
    endDate: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.userEmail) params.append('userEmail', filters.userEmail);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await fetch(`/api/admin/activity?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch activities');
      
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Method', 'Path', 'Status', 'Duration (ms)', 'IP Address'];
    const rows = activities.map(activity => [
      format(new Date(activity.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      activity.userEmail || 'Anonymous',
      activity.action,
      activity.resource || '-',
      activity.method || '-',
      activity.path || '-',
      activity.statusCode || '-',
      activity.duration || '-',
      activity.ipAddress || '-',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('POST')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE') || action.includes('PUT')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('VIEW') || action.includes('GET')) return 'bg-gray-100 text-gray-800';
    if (action.includes('ADMIN')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (statusCode?: number) => {
    if (!statusCode) return 'bg-gray-100 text-gray-800';
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-100 text-green-800';
    if (statusCode >= 400 && statusCode < 500) return 'bg-yellow-100 text-yellow-800';
    if (statusCode >= 500) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const filteredActivities = activities.filter(activity => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      activity.userEmail?.toLowerCase().includes(search) ||
      activity.action.toLowerCase().includes(search) ||
      activity.resource?.toLowerCase().includes(search) ||
      activity.path?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  // Check if activity logging is properly configured
  const activityLoggingEnabled = process.env.ENABLE_ACTIVITY_LOGGING === 'true';
  const isPreviewMode = process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development';
  
  if (!activityLoggingEnabled && activities.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Activity Trail</h1>
          <p className="text-gray-600 mt-1">Monitor all system activity and user actions</p>
        </div>
        
        <Card className="border-yellow-200">
          <CardContent className="py-12">
            <div className="text-center">
              <Shield className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-yellow-800">⚠️ Activity Logging Not Configured</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-4">
                Activity logging is currently disabled. To enable comprehensive activity tracking, 
                the <code className="bg-gray-100 px-1 rounded">ENABLE_ACTIVITY_LOGGING</code> environment 
                variable must be set to &quot;true&quot;.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-lg mx-auto">
                <h4 className="font-medium text-blue-800 mb-2">What this feature provides:</h4>
                <ul className="text-sm text-blue-700 text-left space-y-1">
                  <li>• User authentication and access logs</li>
                  <li>• API endpoint usage tracking</li>
                  <li>• Data modification audit trail</li>
                  <li>• Admin action monitoring</li>
                  <li>• Performance and error tracking</li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                {isPreviewMode ? 
                  "Currently in preview mode - activity logging is optional for testing environments." :
                  "Activity logging is disabled by default in production for performance and privacy."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Activity Trail</h1>
          <p className="text-gray-600 mt-1">Monitor all system activity and user actions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchActivities} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">User Email</label>
              <Input
                placeholder="user@example.com"
                value={filters.userEmail}
                onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Action</label>
              <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="VIEW_ITEMS">View Items</SelectItem>
                  <SelectItem value="CREATE_ITEM">Create Item</SelectItem>
                  <SelectItem value="UPDATE_ITEM">Update Item</SelectItem>
                  <SelectItem value="DELETE_ITEM">Delete Item</SelectItem>
                  <SelectItem value="ADMIN">Admin Actions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity ({filteredActivities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        {format(new Date(activity.timestamp), 'MMM dd, HH:mm:ss')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{activity.userEmail || 'Anonymous'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionBadgeColor(activity.action)}>
                        {activity.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {activity.resource || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {activity.method || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {activity.path || '-'}
                    </TableCell>
                    <TableCell>
                      {activity.statusCode && (
                        <Badge className={getStatusBadgeColor(activity.statusCode)}>
                          {activity.statusCode}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {activity.duration ? `${activity.duration}ms` : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-gray-400" />
                        {activity.ipAddress || '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredActivities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No activities found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}