'use client';

import { useState, useEffect } from 'react';
import { searchIndexItems } from '@/lib/indexItems';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import TableContent from './SearchResultTableBody';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const campusInfo = [
  { id: 'collegeOfSanMateo', value: 'College of San Mateo' },
  { id: 'canadaCollege', value: 'Cañada College' },
  { id: 'districtOffice', value: 'District Office' },
  { id: 'skylineCollege', value: 'Skyline College' }
];

const SearchResults = () => {
  const [searchResults, setSearchResults] = useState([]);
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

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = (data.get('query') as string) || '';

    // Check if the query is "null" and no campus is selected, then fetch all items
    if ((query === 'null' || query === '') && !selectedCampus) {
      fetchAllItems();
    } else {
      try {
        const response = await searchIndexItems(
          query || undefined,
          selectedCampus
        );
        const results = response.results;
        setSearchResults(sortArray(results));
      } catch (error) {
        console.error('Failed to search index items:', error);
      }
    }
  }

  function sortArray(array) {
    const sortedArray = [...array];
    sortedArray.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'id') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else {
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
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

  function requestSort(key) {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const getClassNamesFor = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? 'sort-asc' : 'sort-desc';
    }
    return '';
  };

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
              className="bg-white max-w-3xl block flex-1 py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 bg-transparent border border-gray-300 rounded-md focus:ring-0 sm:text-sm sm:leading-6"
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
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedCampus('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      </form>
      <ScrollArea className="mx-5 mt-5 border rounded-md bg-white h-[calc(100vh-375px)] ">
        <table className="min-w-full divide-y divide-gray-300 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="w-1/12 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 cursor-pointer sm:pl-6"
                onClick={() => requestSort('id')}
              >
                ID <span className={getClassNamesFor('id')}></span>
              </th>
              <th
                className="w-4/12 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                onClick={() => requestSort('title')}
              >
                Title <span className={getClassNamesFor('title')}></span>
              </th>
              <th
                className="w-1/12 py-3.5 text-center text-sm font-semibold text-gray-900 cursor-pointer"
                onClick={() => requestSort('letter')}
              >
                Letter <span className={getClassNamesFor('letter')}></span>
              </th>
              <th
                className="w-3/12 py-3.5 text-center text-sm font-semibold text-gray-900 cursor-pointer"
                onClick={() => requestSort('campus')}
              >
                Campus <span className={getClassNamesFor('campus')}></span>
              </th>
              <th className="w-3/12 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Actions{' '}
                <span className="text-gray-500">(hover row to view)</span>
              </th>
            </tr>
          </thead>
          <TableContent searchResults={searchResults} />
        </table>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </>
  );
};

export default SearchResults;
