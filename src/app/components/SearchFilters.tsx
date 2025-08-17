'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MinusCircle, Search } from 'lucide-react';

const campusInfo = [
  { id: 'collegeOfSanMateo', value: 'College of San Mateo' },
  { id: 'canadaCollege', value: 'Cañada College' },
  { id: 'districtOffice', value: 'District Office' },
  { id: 'skylineCollege', value: 'Skyline College' }
];

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [selectedCampus, setSelectedCampus] = useState(
    searchParams.get('campus') || ''
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = (formData.get('query') as string) || '';
    
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedCampus) params.set('campus', selectedCampus);
    
    startTransition(() => {
      router.push(`/admin?${params.toString()}`);
    });
  }

  function clearFilters() {
    setSelectedCampus('');
    startTransition(() => {
      router.push('/admin');
    });
  }

  return (
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
            defaultValue={searchParams.get('q') || ''}
            className="bg-white max-w-3xl block flex-1 py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md focus:ring-0 sm:text-sm sm:leading-6"
          />
          <Button variant="default" type="submit" disabled={isPending}>
            {isPending ? 'Searching...' : 'Search'} <Search className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <fieldset className="max-w-3xl mt-4 shadow-sm">
          <legend className="sr-only">Select campus to filter results</legend>
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
            type="button"
            variant="ghost"
            onClick={clearFilters}
            disabled={isPending}
          >
            Clear Filters <MinusCircle className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </form>
  );
}