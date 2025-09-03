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
  Database, RefreshCw, Trash2, Search, AlertCircle
} from 'lucide-react';
import { useCSRF } from '@/hooks/useCSRF';

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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cache Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Manage cache entries and monitor performance</p>
        </div>
        <Button onClick={fetchCacheData} variant="outline" size="sm" aria-label="Refresh cache data">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
          <p className="text-sm text-blue-800">
            The cache stores API responses to make the site faster. You can clear specific cache entries to force fresh data loading.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Cache Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Keys:</span>
                  <span className="font-semibold">{stats?.totalKeys || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Memory Used:</span>
                  <span className="font-semibold">{stats?.memoryUsage || '0 KB'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Hit Rate:</span>
                  <span className="font-semibold text-green-600">
                    {((stats?.hitRate || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Clear Actions</CardTitle>
              <p className="text-sm text-muted-foreground">Clear cache by campus</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'csm', name: 'College of San Mateo' },
                  { key: 'skyline', name: 'Skyline College' },
                  { key: 'canada', name: 'Cañada College' },
                  { key: 'district', name: 'District Office' }
                ].map((campus) => (
                  <Button
                    key={campus.key}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPatternInput(`*${campus.name}*`);
                      setShowPatternModal(true);
                    }}
                    className="text-left justify-start h-auto p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">{campus.name}</div>
                      <div className="text-xs text-gray-500">Clear cache</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Search & Clear</CardTitle>
              <p className="text-sm text-muted-foreground">Clear specific cache entries</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search cache keys..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPatternModal(true)}
                  className="w-full"
                >
                  Clear by Pattern
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cache Entries Table - Simplified */}
      <div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cache Entries</CardTitle>
                <p className="text-sm text-muted-foreground">{filteredEntries.length} entries found</p>
              </div>
              {selectedKeys.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowInvalidateModal(true)}
                >
                  Clear Selected ({selectedKeys.size})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No cache entries found matching your search.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEntries.slice(0, 50).map((entry) => (
                <div key={entry.key} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
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
                      className="rounded"
                    />
                    <div>
                      <div className="font-mono text-sm text-gray-900">{entry.key}</div>
                      <div className="text-xs text-gray-500">
                        {entry.size} • TTL: {entry.ttl === -1 ? 'Permanent' : `${entry.ttl}s`}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInvalidatingKey(entry.key);
                      setShowInvalidateModal(true);
                    }}
                    aria-label={`Clear ${entry.key}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              {filteredEntries.length > 50 && (
                <div className="text-center py-2 text-sm text-gray-500">
                  Showing first 50 entries. Use search to narrow results.
                </div>
              )}
            </div>
          )}
          </div>
          </CardContent>
        </Card>
      </div>

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