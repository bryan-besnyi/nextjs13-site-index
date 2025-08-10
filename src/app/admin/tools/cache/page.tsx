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
  HardDrive, Zap, TrendingUp, Package
} from 'lucide-react';

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
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showInvalidateModal, setShowInvalidateModal] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [patternInput, setPatternInput] = useState('');
  const [invalidatingKey, setInvalidatingKey] = useState<string | null>(null);

  const fetchCacheData = async () => {
    try {
      const response = await fetch('/api/admin/cache');
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
    const filtered = entries.filter(entry =>
      entry.key.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEntries(filtered);
  }, [searchQuery, entries]);

  const handleInvalidateKey = async (key: string) => {
    const loadingToast = toast.loading('Invalidating cache key...');
    
    try {
      const response = await fetch('/api/admin/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });

      if (!response.ok) throw new Error('Failed to invalidate cache');
      
      const result = await response.json();
      toast.success(result.message || 'Cache key invalidated');
      fetchCacheData(); // Refresh data
    } catch (err) {
      toast.error('Failed to invalidate cache key');
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
      const response = await fetch('/api/admin/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: Array.from(selectedKeys) })
      });

      if (!response.ok) throw new Error('Failed to invalidate cache');
      
      const result = await response.json();
      toast.success(`${result.invalidated || selectedKeys.size} cache entries invalidated`);
      setSelectedKeys(new Set());
      fetchCacheData();
    } catch (err) {
      toast.error('Failed to invalidate cache entries');
      console.error(err);
    } finally {
      toast.dismiss(loadingToast);
      setShowInvalidateModal(false);
    }
  };

  const handlePatternInvalidate = async () => {
    const loadingToast = toast.loading('Invalidating cache by pattern...');
    
    try {
      const response = await fetch('/api/admin/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern: patternInput })
      });

      if (!response.ok) throw new Error('Failed to invalidate cache');
      
      const result = await response.json();
      toast.success(`${result.invalidated} cache entries invalidated`);
      fetchCacheData();
    } catch (err) {
      toast.error('Failed to invalidate cache by pattern');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading cache data...</p>
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cache Manager</h1>
          <p className="text-gray-600 mt-1">Manage Vercel KV cache entries and monitor cache performance</p>
        </div>
        <Button onClick={fetchCacheData} variant="outline" size="sm" aria-label="Refresh cache data">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalKeys || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.memoryUsage || '0 KB'}</div>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evictions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.evictions || 0}</div>
          </CardContent>
        </Card>
      </div>

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