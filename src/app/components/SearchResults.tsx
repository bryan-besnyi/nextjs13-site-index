'use client';

import { useState, useEffect } from 'react';
import { searchIndexItems } from '@/lib/indexItems';
import Link from 'next/link';
import DeleteButton from './DeleteButton';
import { ScrollArea } from '@/components/ui/scroll-area';

const SearchResults = () => {
  const [searchResults, setSearchResults] = useState<
    {
      id: number;
      title: string;
      letter: string;
      url: string;
      campus: string;
      createdAt: Date;
      updatedAt: Date;
    }[]
  >([]);

  // Fetch all items when the component mounts
  useEffect(() => {
    fetchAllItems();
  }, []);

  async function fetchAllItems() {
    try {
      const response = await searchIndexItems(''); // Pass an empty string to fetch all items
      const results = response.results;
      results?.sort((a, b) => a.id - b.id); // Sort the results by ID
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to fetch all items:', error);
    }
  }
  /**
   * Handles the form submission event.
   *
   * @param event - The form submission event.
   */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const query = (data.get('query') as string) || '';

    try {
      const response = await searchIndexItems(query);
      const results = response.results;
      results?.sort((a, b) => a.id - b.id); // Sort the results by ID
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search index items:', error);
    }
  }

  return (
    <form className="p-5" onSubmit={handleSubmit}>
      <label
        className="block my-2 text-sm font-medium leading-6 text-gray-900"
        htmlFor="query"
      >
        Search
      </label>
      <div className="flex gap-3">
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
      <ScrollArea className="h-[800px] w-full rounded-md border p-4">
        <table className="min-w-full mt-5 divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
              >
                ID
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Item Title
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Item Letter
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Item Campus
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                <span className="sr-only">Edit</span>
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                <span className="sr-only">Delete</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {searchResults.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    <a href={item.url}>{item.title}</a>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.letter.toUpperCase()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.campus}
                  </div>
                </td>
                <td>
                  <Link href={`/admin/edit/${item.id}`}>Edit</Link>
                </td>
                <td>
                  <DeleteButton id={Number(item.id)} itemName={item.title} />
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
