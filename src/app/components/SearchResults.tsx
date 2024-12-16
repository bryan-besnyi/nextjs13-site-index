'use client';

import { useState, useEffect, useCallback } from 'react';
import { searchIndexItems } from '@/lib/indexItems';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MinusCircle, Search } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
import TableHeader from './TableHeader';
import TableRow from './TableRow';

const campusInfo = [
  { id: 'collegeOfSanMateo', value: 'College of San Mateo' },
  { id: 'canadaCollege', value: 'Cañada College' },
  { id: 'districtOffice', value: 'District Office' },
  { id: 'skylineCollege', value: 'Skyline College' }
];

type SearchResultType = {
  id: number;
  title: string;
  letter: string;
  campus: string;
  url: string;
};

const SearchResults = () => {
  const [searchResults, setSearchResults] = useState<SearchResultType[]>([]);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [selectedCampus, setSelectedCampus] = useState('');

  useEffect(() => {
    fetchAllItems();
  }, []);

  useEffect(() => {
    setSearchResults((prevResults) => sortArray(prevResults));
  }, [sortConfig]);

  async function fetchAllItems() {
    try {
      const response = await searchIndexItems('');
      const results = response.results;
      setSearchResults(sortArray(results));
    } catch (error) {
      console.error('Failed to fetch all items:', error);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = (data.get('query') as string) || '';
    const campusParam = selectedCampus || '';

    try {
      const response = await searchIndexItems(query, campusParam);
      const results = response.results;
      setSearchResults(sortArray(results ?? []));
    } catch (error) {
      console.error('Failed to search index items:', error);
    }
  }

  function sortArray(array: SearchResultType[]) {
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
  }

  const requestSort = useCallback(
    (key: keyof SearchResultType) => {
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
    ({ index, style }) => {
      const item = searchResults[index];
      return <TableRow key={item.id} item={item} style={style} />;
    },
    [searchResults]
  );

  return (
    <>
      <form className="px-5 pt-3" onSubmit={handleSubmit}>
        <div>
          <label
            className="block mb-2 text-sm font-medium leading-6 text-gray-900"
            htmlFor="query"
          >
            Search
          </label>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              name="query"
              id="query"
              className="bg-white max-w-3xl block flex-1 py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md focus:ring-0 sm:text-sm sm:leading-6"
            />
            <Button variant="default" type="submit">
              Search <Search className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <fieldset className="max-w-3xl mt-4 shadow-sm ">
            <div className="grid grid-cols-4 px-4 py-2 bg-white border border-gray-300 rounded-sm">
              {campusInfo.map((campus) => (
                <div key={campus.id} className="flex items-center">
                  <input
                    id={campus.id}
                    name="campus"
                    value={campus.value}
                    type="radio"
                    checked={selectedCampus === campus.value}
                    onChange={() => setSelectedCampus(campus.value)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                  />
                  <label
                    htmlFor={campus.id}
                    className="block ml-3 text-sm font-medium leading-6 text-gray-900"
                  >
                    {campus.value}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
          <div className="flex justify-end max-w-3xl mt-2 text-gray-600">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedCampus('');
              }}
            >
              Clear Filters <MinusCircle className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </form>
      <ScrollArea className="mx-5 mt-5 border rounded-md bg-white h-[calc(100vh-375px)]">
        <div className="min-w-full divide-y divide-gray-300">
          <TableHeader
            requestSort={requestSort}
            getClassNamesFor={getClassNamesFor}
          />
          <List
            height={window.innerHeight - 375}
            itemCount={searchResults.length}
            itemSize={50}
            width="100%"
          >
            {rowRenderer}
          </List>
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </>
  );
};

export default SearchResults;
