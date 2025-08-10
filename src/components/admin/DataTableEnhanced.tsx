'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Download, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// Define the data type
type IndexItem = {
  id: number;
  title: string;
  letter: string;
  campus: string;
  url: string;
};

// Helper function for copying to clipboard
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  } catch (error) {
    toast.error('Failed to copy to clipboard');
    console.error('Clipboard error:', error);
  }
};

// Define columns
const columns: ColumnDef<IndexItem>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
        aria-label="Select all"
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(!!e.target.checked)}
        aria-label="Select row"
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-mono text-sm">{row.getValue('id')}</div>,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="max-w-xs truncate" title={row.getValue('title')}>
        {row.getValue('title')}
      </div>
    ),
  },
  {
    accessorKey: 'letter',
    header: 'Letter',
    cell: ({ row }) => (
      <div className="font-mono text-center w-8">
        {row.getValue('letter')}
      </div>
    ),
  },
  {
    accessorKey: 'campus',
    header: 'Campus',
    cell: ({ row }) => (
      <div className="max-w-32 truncate" title={row.getValue('campus')}>
        {row.getValue('campus')}
      </div>
    ),
  },
  {
    accessorKey: 'url',
    header: 'URL',
    cell: ({ row }) => (
      <a
        href={row.getValue('url')}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline max-w-48 truncate block"
        title={row.getValue('url')}
      >
        {row.getValue('url')}
      </a>
    ),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const item = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => copyToClipboard(item.url)}
            >
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/admin/edit/${item.id}`}>Edit item</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Delete item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

interface DataTableEnhancedProps {
  initialData: IndexItem[];
}

export default function DataTableEnhanced({ initialData }: DataTableEnhancedProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [operationError, setOperationError] = React.useState<string | null>(null);

  const table = useReactTable({
    data: initialData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  const handleBulkExport = async () => {
    if (selectedRowCount === 0) {
      toast.error('Please select items to export');
      return;
    }

    setIsLoading(true);
    setOperationError(null);

    try {
      const selectedItems = table.getFilteredSelectedRowModel().rows.map(row => row.original);
      const csvContent = [
        'ID,Title,Letter,Campus,URL',
        ...selectedItems.map(item => 
          `${item.id},"${item.title}",${item.letter},"${item.campus}","${item.url}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `index-items-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${selectedRowCount} items successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setOperationError(errorMessage);
      toast.error(errorMessage);
      console.error('Export error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowCount === 0) {
      toast.error('Please select items to delete');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedRowCount} item${selectedRowCount > 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    setOperationError(null);

    try {
      const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
      
      // This would normally call an API endpoint
      // await deleteBulkIndexItems(selectedIds);
      
      // For now, simulate the operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you'd refresh the data or remove from state
      toast.success(`Deleted ${selectedRowCount} items successfully`);
      setRowSelection({});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete operation failed';
      setOperationError(errorMessage);
      toast.error(errorMessage);
      console.error('Bulk delete error:', error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Index Items</CardTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter titles..."
              value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn('title')?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Campus <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Filter by Campus</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => table.getColumn('campus')?.setFilterValue('')}
                >
                  All Campuses
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => table.getColumn('campus')?.setFilterValue('College of San Mateo')}
                >
                  College of San Mateo
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => table.getColumn('campus')?.setFilterValue('Skyline College')}
                >
                  Skyline College
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => table.getColumn('campus')?.setFilterValue('Cañada College')}
                >
                  Cañada College
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => table.getColumn('campus')?.setFilterValue('District Office')}
                >
                  District Office
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild>
              <Link href="/admin/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Error Display */}
        {operationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 font-medium">Operation failed</p>
                <p className="text-sm text-red-600 mt-1">{operationError}</p>
              </div>
              <button
                onClick={() => setOperationError(null)}
                className="text-red-600 hover:text-red-800 text-sm underline ml-4"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedRowCount > 0 && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
            <span className="text-sm font-medium">
              {selectedRowCount} item{selectedRowCount > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBulkExport}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isLoading}
                onClick={() => toast('Bulk edit feature coming soon', { icon: 'ℹ️' })}
              >
                Bulk Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleBulkDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Data Table */}
        <div 
          className="rounded-md border"
          role="table"
          aria-label="Index items data table"
          aria-describedby="table-summary"
        >
          <div id="table-summary" className="sr-only">
            Table showing {table.getFilteredRowModel().rows.length} index items with columns for selection, ID, title, letter, campus, URL, and actions. Use arrow keys to navigate between cells.
          </div>
          
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => {
                    return (
                      <th 
                        key={header.id} 
                        className="h-12 px-4 text-left align-middle"
                        scope="col"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="border-b hover:bg-gray-50 data-[state=selected]:bg-blue-50"
                    aria-rowindex={index + 2}
                    aria-selected={row.getIsSelected()}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 align-middle">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={columns.length} 
                    className="h-24 text-center"
                    role="cell"
                    aria-live="polite"
                  >
                    No results found. Try adjusting your search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}