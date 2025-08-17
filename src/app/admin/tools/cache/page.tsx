'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { 
  Database, RefreshCw, Trash2, Search, AlertCircle,
  HardDrive, Zap, TrendingUp, Package, Filter
} from 'lucide-react';
import { useCSRF } from '@/hooks/useCSRF';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CacheStats {
  totalKeys: number;
  memoryUsage: string;
  hitRate: number;
  missRate: number;
  evictions: number;
}

interface CacheEntry {
  key: string;
  value: string;
  ttl: number;
  size: string;
}

export default function CachePage() {
  const { fetchWithCSRF, isLoading: csrfLoading, error: csrfError } = useCSRF();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showInvalidateModal, setShowInvalidateModal] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [patternInput, setPatternInput] = useState('');
  const [invalidatingKey, setInvalidatingKey] = useState<string | null>(null);

  const fetchCacheData = async () => {
    try {
      const response = await fetch('/api/admin/cache', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch cache data');
      
      const data = await response.json();
      setStats(data.stats);
      setEntries(data.entries);
      setFilteredEntries(data.entries);
      setError(null);
    } catch (err) {
      setError('Failed to load cache data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCacheData();
  }, []);

  useEffect(() => {
    let filtered = entries.filter(entry =>
      entry.key.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply campus filter
    if (campusFilter !== 'all') {
      const campusMapping = {
        'csm': 'College of San Mateo',
        'skyline': 'Skyline College',
        'canada': 'Cañada College',
        'district': 'District Office'
      };
      
      const campusName = campusMapping[campusFilter as keyof typeof campusMapping];
      if (campusName) {
        filtered = filtered.filter(entry => 
          entry.key.includes(campusName) || 
          entry.key.includes(campusFilter.toUpperCase()) ||
          entry.key.includes(`campus:${campusName}`) ||
          entry.key.includes(`${campusFilter}:`)
        );
      }
    }

    setFilteredEntries(filtered);
  }, [searchQuery, campusFilter, entries]);

  const handleInvalidateKey = async (key: string) => {
    const loadingToast = toast.loading('Invalidating cache key...');
    
    try {
      const response = await fetchWithCSRF('/api/admin/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to invalidate cache');
      }
      
      const result = await response.json();
      toast.success(result.message || 'Cache key invalidated');
      fetchCacheData(); // Refresh data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invalidate cache key';
      toast.error(errorMessage);
      console.error(err);
    } finally {
      toast.dismiss(loadingToast);
      setShowInvalidateModal(false);
      setInvalidatingKey(null);
    }
  };

  const handleBulkInvalidate = async () => {
    const loadingToast = toast.loading('Invalidating cache entries...');
    
    try {
      const response = await fetchWithCSRF('/api/admin/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: Array.from(selectedKeys) })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to invalidate cache');
      }
      
      const result = await response.json();
      toast.success(`${result.invalidated || selectedKeys.size} cache entries invalidated`);
      setSelectedKeys(new Set());
      fetchCacheData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invalidate cache entries';
      toast.error(errorMessage);
      console.error(err);
    } finally {
      toast.dismiss(loadingToast);
      setShowInvalidateModal(false);
    }
  };

  const handlePatternInvalidate = async () => {
    const loadingToast = toast.loading('Invalidating cache by pattern...');
    
    try {
      const response = await fetchWithCSRF('/api/admin/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern: patternInput })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to invalidate cache');
      }
      
      const result = await response.json();
      toast.success(`${result.invalidated} cache entries invalidated`);
      fetchCacheData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invalidate cache by pattern';
      toast.error(errorMessage);
      console.error(err);
    } finally {
      toast.dismiss(loadingToast);
      setShowPatternModal(false);
      setPatternInput('');
    }
  };

  const toggleSelectAll = () => {
    if (selectedKeys.size === filteredEntries.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filteredEntries.map(e => e.key)));
    }
  };

  if (loading || csrfLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {csrfLoading ? 'Loading security token...' : 'Loading cache data...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || csrfError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || csrfError}</p>
          <Button onClick={fetchCacheData} className="mt-4">
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
          <h1 className="text-3xl font-bold">Cache Manager</h1>
          <p className="text-gray-600 mt-1">Manage Vercel KV cache entries and monitor cache performance</p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>What is this?</strong> The cache stores API responses to make the site faster. 
              Cache entries expire automatically (TTL = seconds until expiration, -1 = permanent).
              You can delete cache entries to force fresh data loading.
            </p>
          </div>
        </div>
        <Button onClick={fetchCacheData} variant="outline" size="sm" aria-label="Refresh cache data">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalKeys || 0}</div>
            <p className="text-xs text-muted-foreground">Cached API responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.memoryUsage || '0 KB'}</div>
            <p className="text-xs text-muted-foreground">Storage used by cache</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats?.hitRate || 0) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Requests served from cache</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miss Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats?.missRate || 0) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Requests needing fresh data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evictions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.evictions || 0}</div>
            <p className="text-xs text-muted-foreground">Items removed due to limits</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Non-Technical Users */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Quick Actions by Campus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            {[
              { key: 'csm', name: 'College of San Mateo', color: 'bg-blue-500' },
              { key: 'skyline', name: 'Skyline College', color: 'bg-green-500' },
              { key: 'canada', name: 'Cañada College', color: 'bg-purple-500' },
              { key: 'district', name: 'District Office', color: 'bg-orange-500' }
            ].map((campus) => (
              <Button
                key={campus.key}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
                onClick={() => {
                  setPatternInput(`*${campus.name}*`);
                  setShowPatternModal(true);
                }}
              >
                <div className={`w-3 h-3 rounded-full ${campus.color} mb-2`}></div>
                <div className="text-left">
                  <div className="font-semibold text-sm">{campus.name}</div>
                  <div className="text-xs text-gray-500">Clear {campus.name.split(' ')[0]} cache</div>
                </div>
              </Button>
            ))}
          </div>
          <div className="text-sm text-blue-800">
            <p><strong>💡 Tip:</strong> Use these buttons to clear cache for a specific campus when you update content on that campus&apos;s website.</p>
          </div>
        </CardContent>
      </Card>

      {/* Cache Entries Help */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Understanding Cache Entries:</h4>
              <ul className="space-y-1 text-gray-600">
                <li><strong>Key:</strong> Unique identifier for cached data</li>
                <li><strong>Size:</strong> Memory used by this entry</li>
                <li><strong>TTL:</strong> Seconds until expiration (-1 = never expires)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Common Cache Types:</h4>
              <ul className="space-y-1 text-gray-600">
                <li><strong>index:*</strong> Search results by campus/letter</li>
                <li><strong>api:*</strong> API response caching</li>
                <li><strong>alerts:*</strong> Performance monitoring data</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What do the actions do?</h4>
              <ul className="space-y-1 text-gray-600">
                <li><strong>🗑️ Individual Delete:</strong> Removes one cache entry</li>
                <li><strong>Bulk Delete:</strong> Removes selected entries</li>
                <li><strong>Pattern Delete:</strong> Removes entries matching a pattern (e.g., api:*)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Entries Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Cache Entries</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search cache keys..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={campusFilter} onValueChange={setCampusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by campus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campuses</SelectItem>
                  <SelectItem value="csm">College of San Mateo</SelectItem>
                  <SelectItem value="skyline">Skyline College</SelectItem>
                  <SelectItem value="canada">Cañada College</SelectItem>
                  <SelectItem value="district">District Office</SelectItem>
                </SelectContent>
              </Select>
              {selectedKeys.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowInvalidateModal(true)}
                >
                  Invalidate Selected ({selectedKeys.size})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPatternModal(true)}
              >
                Invalidate by Pattern
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <input
                      type="checkbox"
                      checked={selectedKeys.size === filteredEntries.length && filteredEntries.length > 0}
                      onChange={toggleSelectAll}
                      aria-label="Select all entries"
                    />
                  </th>
                  <th className="text-left p-2">Key</th>
                  <th className="text-right p-2">Size</th>
                  <th className="text-right p-2">TTL (seconds)</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.key} className="border-b">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedKeys.has(entry.key)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedKeys);
                          if (e.target.checked) {
                            newSelected.add(entry.key);
                          } else {
                            newSelected.delete(entry.key);
                          }
                          setSelectedKeys(newSelected);
                        }}
                      />
                    </td>
                    <td className="p-2 font-mono text-xs">{entry.key}</td>
                    <td className="text-right p-2">{entry.size}</td>
                    <td className="text-right p-2">{entry.ttl}</td>
                    <td className="text-center p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setInvalidatingKey(entry.key);
                          setShowInvalidateModal(true);
                        }}
                        aria-label={`Invalidate ${entry.key}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invalidate Confirmation Modal */}
      <Dialog open={showInvalidateModal} onOpenChange={setShowInvalidateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cache Invalidation</DialogTitle>
            <DialogDescription>
              {invalidatingKey ? (
                <>Are you sure you want to invalidate the cache key: <code className="bg-gray-100 px-1 rounded">{invalidatingKey}</code>?</>
              ) : (
                <>Are you sure you want to invalidate {selectedKeys.size} cache entries?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvalidateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (invalidatingKey) {
                  handleInvalidateKey(invalidatingKey);
                } else {
                  handleBulkInvalidate();
                }
              }}
            >
              {invalidatingKey ? 'Invalidate' : 'Invalidate All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pattern Invalidation Modal */}
      <Dialog open={showPatternModal} onOpenChange={setShowPatternModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invalidate by Pattern</DialogTitle>
            <DialogDescription>
              Enter a pattern to match cache keys. Use * as a wildcard.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., api:indexItems:*"
              value={patternInput}
              onChange={(e) => setPatternInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPatternModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handlePatternInvalidate}
              disabled={!patternInput}
            >
              Invalidate Pattern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}