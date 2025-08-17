'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Zap,
  Search,
  Filter,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Database,
  Download,
  Upload,
  Eye,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { IndexItem, BulkOperation, BulkEditData } from '@/types';

export default function BulkOperationsClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [items, setItems] = useState<IndexItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Bulk Edit State
  const [bulkEditData, setBulkEditData] = useState({
    campus: '',
    letter: '',
    titlePrefix: '',
    titleSuffix: '',
    urlReplace: { from: '', to: '' }
  });

  const campuses = [
    'College of San Mateo',
    'Skyline College',
    'Cañada College',
    'District Office'
  ];

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Debounce search query - only search after user stops typing for 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Optimized search query with minimum length requirement
  const shouldSkipSearch = useMemo(() => {
    const trimmedSearch = debouncedSearchQuery?.trim();
    // Skip search if query is between 1-2 characters (too short and causes cache pollution)
    return trimmedSearch && trimmedSearch.length > 0 && trimmedSearch.length < 3;
  }, [debouncedSearchQuery]);

  const fetchItems = useCallback(async () => {
    // Don't fetch if search is too short
    if (shouldSkipSearch) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const trimmedSearch = debouncedSearchQuery?.trim();
      
      // Only add search param if it's 3+ characters or empty (for "show all")
      if (trimmedSearch && trimmedSearch.length >= 3) {
        params.append('search', trimmedSearch);
      }
      if (selectedCampus?.trim()) params.append('campus', selectedCampus.trim());
      if (selectedLetter?.trim()) params.append('letter', selectedLetter.trim());

      console.log('Fetching items with params:', params.toString());
      const response = await fetch(`/api/indexItems?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error response:', errorText);
        throw new Error(`Failed to fetch items: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched data:', data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data.results) {
        setItems(data.results);
      } else if (data.indexItems) {
        setItems(data.indexItems);
      } else {
        console.warn('Unexpected data format:', data);
        setItems([]);
      }
    } catch (error) {
      toast.error('Failed to load items');
      console.error('Fetch error:', error);
      setItems([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, selectedCampus, selectedLetter, shouldSkipSearch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const createOperation = (type: BulkOperation['type']): BulkOperation => {
    const operation: BulkOperation = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      status: 'pending',
      itemCount: selectedItems.size,
      processedCount: 0,
      errors: [],
      startTime: new Date().toISOString()
    };
    setOperations(prev => [operation, ...prev]);
    return operation;
  };

  const updateOperation = (id: string, updates: Partial<BulkOperation>) => {
    setOperations(prev => 
      prev.map(op => op.id === id ? { ...op, ...updates } : op)
    );
  };

  const executeBulkOperation = async (operation: BulkOperation, operationType: 'delete' | 'update', updateData?: any) => {
    updateOperation(operation.id, { status: 'running' });
    
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token');
      const csrfData = await csrfResponse.json();
      
      // Prepare bulk operation request
      const requestBody: any = {
        operation: operationType,
        items: Array.from(selectedItems)
      };
      
      if (operationType === 'update' && updateData) {
        requestBody.updateData = updateData;
      }

      // Execute bulk operation
      const response = await fetch('/api/admin/bulk', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          [csrfData.headerName]: csrfData.token
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Bulk operation failed');
      }

      // Update operation status
      updateOperation(operation.id, {
        status: 'completed',
        processedCount: result.count,
        endTime: new Date().toISOString()
      });

      toast.success(`Successfully ${operationType}d ${result.count} items in ${result.duration}ms`);
      setSelectedItems(new Set());
      fetchItems(); // Refresh the list

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateOperation(operation.id, {
        status: 'failed',
        errors: [errorMessage],
        endTime: new Date().toISOString()
      });
      
      toast.error(`Bulk operation failed: ${errorMessage}`);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to update');
      return;
    }

    // Validate that we have some update data
    const hasUpdates = bulkEditData.campus || bulkEditData.letter || 
                      bulkEditData.titlePrefix || bulkEditData.titleSuffix ||
                      bulkEditData.urlReplace.from;

    if (!hasUpdates) {
      toast.error('Please specify what to update');
      return;
    }

    const operation = createOperation('update');
    
    // Prepare update data
    const updateData: any = {};
    if (bulkEditData.campus) updateData.campus = bulkEditData.campus;
    if (bulkEditData.letter) updateData.letter = bulkEditData.letter;
    
    // Handle title prefix/suffix (would need server-side logic for complex transformations)
    if (bulkEditData.titlePrefix || bulkEditData.titleSuffix) {
      toast('Title prefix/suffix updates are not yet supported. Use campus/letter changes for now.', {
        icon: 'ℹ️',
        duration: 4000
      });
      return;
    }
    
    // Handle URL replacement (would need server-side logic)
    if (bulkEditData.urlReplace.from && bulkEditData.urlReplace.to) {
      toast('URL replacement is not yet supported. Use individual edits for URL changes.', {
        icon: 'ℹ️',
        duration: 4000
      });
      return;
    }

    await executeBulkOperation(operation, 'update', updateData);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to delete');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedItems.size} items? This action cannot be undone.`
    );

    if (!confirmed) return;

    const operation = createOperation('delete');
    await executeBulkOperation(operation, 'delete');
  };

  const handleBulkMove = async () => {
    if (selectedItems.size === 0 || !bulkEditData.campus) {
      toast.error('Please select items and specify a target campus');
      return;
    }

    const operation = createOperation('move');
    const updateData = { campus: bulkEditData.campus };
    
    await executeBulkOperation(operation, 'update', updateData);
  };

  const getSelectedItemsPreview = () => {
    return items.filter(item => selectedItems.has(item.id));
  };

  const getOperationIcon = (type: BulkOperation['type']) => {
    switch (type) {
      case 'update':
        return <Edit className="h-4 w-4" />;
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      case 'move':
        return <ArrowRight className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getOperationStatus = (operation: BulkOperation) => {
    switch (operation.status) {
      case 'running':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Running ({operation.processedCount}/{operation.itemCount})
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            Completed
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            Failed ({operation.errors.length} errors)
          </div>
        );
      default:
        return <span className="text-gray-500">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search and Filter Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search titles (min 3 characters)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={shouldSkipSearch ? 'border-yellow-300 bg-yellow-50' : ''}
              />
              {shouldSkipSearch && (
                <p className="text-xs text-yellow-600 mt-1">
                  Enter at least 3 characters to search
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="campus-filter">Campus</Label>
              <select
                id="campus-filter"
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="">All Campuses</option>
                {campuses.map(campus => (
                  <option key={campus} value={campus}>{campus}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="letter-filter">Letter</Label>
              <select
                id="letter-filter"
                value={selectedLetter}
                onChange={(e) => setSelectedLetter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="">All Letters</option>
                {letters.map(letter => (
                  <option key={letter} value={letter}>{letter}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchItems} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Select Items ({items.length} found)
            </div>
            <div className="flex items-center gap-2">
              {selectedItems.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Selected ({selectedItems.size})
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedItems.size === items.length && items.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="select-all">Select All ({items.length} items)</Label>
              </div>
              
              <div className="max-h-60 overflow-y-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="p-2 text-left w-12">Select</th>
                      <th className="p-2 text-left">Title</th>
                      <th className="p-2 text-left w-16">Letter</th>
                      <th className="p-2 text-left">Campus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-2 max-w-xs truncate" title={item.title}>
                          {item.title}
                        </td>
                        <td className="p-2 text-center font-mono">{item.letter}</td>
                        <td className="p-2">{item.campus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No items found. Try adjusting your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Selected Items */}
      {showPreview && selectedItems.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Selected Items Preview</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto">
              {getSelectedItemsPreview().map(item => (
                <div key={item.id} className="text-sm py-1 border-b border-blue-200">
                  <span className="font-mono text-xs bg-white px-1 rounded mr-2">
                    {item.letter}
                  </span>
                  <span className="font-medium">{item.title}</span>
                  <span className="text-muted-foreground ml-2">({item.campus})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Operations */}
      {selectedItems.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Bulk Operations ({selectedItems.size} items selected)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bulk Edit */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-4">Bulk Edit</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Change Campus To:</Label>
                  <select
                    value={bulkEditData.campus}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, campus: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm"
                  >
                    <option value="">No change</option>
                    {campuses.map(campus => (
                      <option key={campus} value={campus}>{campus}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Change Letter To:</Label>
                  <select
                    value={bulkEditData.letter}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, letter: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm"
                  >
                    <option value="">No change</option>
                    {letters.map(letter => (
                      <option key={letter} value={letter}>{letter}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button
                onClick={handleBulkUpdate}
                className="mt-4"
                disabled={!bulkEditData.campus && !bulkEditData.letter}
              >
                <Edit className="mr-2 h-4 w-4" />
                Update Selected Items
              </Button>
            </div>

            {/* Bulk Move */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-4">Move to Campus</h4>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Target Campus:</Label>
                  <select
                    value={bulkEditData.campus}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, campus: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm"
                  >
                    <option value="">Select campus</option>
                    {campuses.map(campus => (
                      <option key={campus} value={campus}>{campus}</option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleBulkMove}
                  disabled={!bulkEditData.campus}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Move Items
                </Button>
              </div>
            </div>

            {/* Bulk Delete */}
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <h4 className="font-medium mb-4 text-red-800">Danger Zone</h4>
              <p className="text-sm text-red-700 mb-4">
                This will permanently delete all selected items. This action cannot be undone.
              </p>
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected Items
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operations History */}
      {operations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Recent Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {operations.slice(0, 5).map(operation => (
                <div key={operation.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {getOperationIcon(operation.type)}
                    <div>
                      <p className="font-medium capitalize">{operation.type} Operation</p>
                      <p className="text-sm text-muted-foreground">
                        {operation.itemCount} items • {operation.startTime && new Date(operation.startTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getOperationStatus(operation)}
                    {operation.errors.length > 0 && (
                      <details className="text-xs mt-1">
                        <summary className="cursor-pointer text-red-600">
                          {operation.errors.length} errors
                        </summary>
                        <ul className="mt-1 text-red-600 max-h-20 overflow-y-auto">
                          {operation.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}