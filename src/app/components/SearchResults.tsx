'use client';

import { useState, useEffect } from 'react';
import { searchIndexItems } from '@/lib/indexItems';
import Link from 'next/link';
import DeleteButton from './DeleteButton';
import { ScrollArea } from '@/components/ui/scroll-area';

const SearchResults = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

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

    try {
      const response = await searchIndexItems(query);
      const results = response.results;
      setSearchResults(sortArray(results));
    } catch (error) {
      console.error('Failed to search index items:', error);
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
    <form className="px-5 pt-3 bg-gray-50" onSubmit={handleSubmit}>
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
            className="block bg-white flex-1 border-1 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
          />
          <button
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            type="submit"
          >
            Search
          </button>
        </div>
      </div>
      <ScrollArea className="h-[1000px] w-full rounded-md border">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer"
                onClick={() => requestSort('id')}
              >
                ID <span className={getClassNamesFor('id')}></span>
              </th>
              <th
                className="py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                onClick={() => requestSort('title')}
              >
                Item Title <span className={getClassNamesFor('title')}></span>
              </th>
              <th
                className="py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                onClick={() => requestSort('letter')}
              >
                Item Letter <span className={getClassNamesFor('letter')}></span>
              </th>
              <th
                className="py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                onClick={() => requestSort('campus')}
              >
                Item Campus <span className={getClassNamesFor('campus')}></span>
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Actions{' '}
                <span className="text-gray-500">(hover row to view)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {searchResults.map((item) => (
              <tr key={item.id} className="group hover:bg-gray-100">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.id}
                  </div>
                </td>
                <td className="py-4 text-left whitespace-nowrap">
                  <div className="flex items-start text-sm font-medium text-gray-900">
                    <Link
                      href={`/admin/edit/${item.id}`}
                      className="hover:underline hover:text-indigo-900"
                    >
                      {item.title}
                    </Link>
                    <a
                      href={item.url}
                      aria-label={`View ${item.title} on Production Site`}
                      target="_blank"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 ml-2 hover:text-indigo-700"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </a>
                  </div>
                </td>
                <td className="py-4 text-center whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.letter.toUpperCase()}
                  </div>
                </td>
                <td className="py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.campus}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Link
                      className="px-3 py-1 text-sm font-semibold text-indigo-900 transition-opacity duration-100 bg-indigo-200 rounded shadow-sm opacity-0 group-hover:opacity-100 hover:bg-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                      href={`/admin/edit/${item.id}`}
                    >
                      Edit Item ✏️
                    </Link>
                    <div className="transition-opacity duration-100 opacity-0 group-hover:opacity-100">
                      <DeleteButton
                        id={Number(item.id)}
                        itemName={item.title}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </form>
  );
};

export default SearchResults;
