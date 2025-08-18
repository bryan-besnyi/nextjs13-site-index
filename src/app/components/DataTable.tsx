'use client';

import { useState, useCallback, useEffect } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { FixedSizeList as List } from 'react-window';
import TableHeader from './TableHeader';
import TableRow from './TableRow';

type SearchResultType = {
  id: number;
  title: string;
  letter: string;
  campus: string;
  url: string;
};

interface DataTableProps {
  initialData: SearchResultType[];
}

export default function DataTable({ initialData }: DataTableProps) {
  const [searchResults, setSearchResults] = useState<SearchResultType[]>(initialData);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  const sortArray = useCallback((array: SearchResultType[]) => {
    const sortedArray = [...array];
    sortedArray.sort((a, b) => {
      const key = sortConfig.key as keyof SearchResultType;
      let aValue = a[key];
      let bValue = b[key];

      if (key === 'id') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else {
        aValue = aValue?.toString().toLowerCase() ?? '';
        bValue = bValue?.toString().toLowerCase() ?? '';
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortedArray;
  }, [sortConfig]);

  // Update results when initialData changes (from server navigation)
  useEffect(() => {
    setSearchResults(sortArray(initialData));
  }, [initialData, sortArray]);

  // Re-sort when sort config changes
  useEffect(() => {
    setSearchResults((prevResults) => sortArray(prevResults));
  }, [sortConfig, sortArray]);

  const requestSort = useCallback(
    (key: string) => {
      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ key, direction });
    },
    [sortConfig]
  );

  const getClassNamesFor = useCallback(
    (key: string) => {
      if (sortConfig.key === key) {
        return sortConfig.direction === 'asc' ? 'sort-asc' : 'sort-desc';
      }
      return '';
    },
    [sortConfig]
  );

  const rowRenderer = useCallback(
    ({ index, style }: { index: number; style: any }) => {
      const item = searchResults[index];
      return <TableRow key={item.id} item={item} style={style} />;
    },
    [searchResults]
  );

  // Calculate height dynamically, fallback for SSR
  const [tableHeight, setTableHeight] = useState(600);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const height = window.innerHeight - 375;
      setTableHeight(height > 300 ? height : 600);
    }
  }, []);

  return (
    <ScrollArea className={`mx-5 mt-5 border rounded-md bg-white h-[calc(100vh-375px)]`}>
      <div 
        className="min-w-full divide-y divide-gray-300" 
        role="table" 
        aria-label={`Index items table with ${searchResults?.length || 0} results`}
        aria-rowcount={(searchResults?.length || 0) + 1}
      >
        <div role="rowgroup">
          <TableHeader
            requestSort={requestSort}
            getClassNamesFor={getClassNamesFor}
          />
        </div>
        <div role="rowgroup">
          <List
            height={tableHeight}
            itemCount={searchResults.length}
            itemSize={50}
            width="100%"
            aria-label="Table body with index items"
          >
            {rowRenderer}
          </List>
        </div>
      </div>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
}