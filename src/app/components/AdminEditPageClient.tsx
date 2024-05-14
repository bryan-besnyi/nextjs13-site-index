'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const AdminEditPageClient = ({ indexItem, campusInfo }) => {
  const [title, setTitle] = useState(indexItem.title);
  const [url, setUrl] = useState(indexItem.url);
  const [letter, setLetter] = useState(indexItem.letter);
  const [campus, setCampus] = useState(indexItem.campus);
  const router = useRouter();

  async function updateIndexItemAction(event) {
    event.preventDefault();

    const response = await fetch('/api/update-index-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: indexItem.id,
        title,
        url,
        letter,
        campus
      })
    });

    if (response.ok) {
      router.push('/admin');
    } else {
      console.error('Failed to update item');
    }
  }

  return (
    <div>
      <h1 className="p-5 text-3xl font-bold bg-slate-200">
        Edit Index Item: {indexItem.title} - (ID: {indexItem.id}) -{' '}
        {indexItem.campus}
      </h1>
      <form
        method="post"
        onSubmit={updateIndexItemAction}
        className="flex flex-col max-w-2xl gap-3 p-5"
      >
        <label
          htmlFor="title"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
        <label
          className="block text-sm font-medium leading-6 text-gray-900"
          htmlFor="url"
        >
          URL
        </label>
        <input
          id="url"
          name="url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
        <label
          className="block text-sm font-medium leading-6 text-gray-900"
          htmlFor="letter"
        >
          Letter
        </label>
        <input
          id="letter"
          type="text"
          name="letter"
          value={letter}
          onChange={(e) => setLetter(e.target.value)}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
        <label
          className="block text-sm font-medium leading-6 text-gray-900"
          htmlFor="campus"
        >
          Campus
        </label>
        <fieldset className="mt-4">
          <div className="space-y-4">
            {campusInfo.map((campusItem) => (
              <div key={campusItem.id} className="flex items-center">
                <input
                  id={campusItem.id}
                  name="campus"
                  value={campusItem.value}
                  type="radio"
                  checked={campus === campusItem.value}
                  onChange={() => setCampus(campusItem.value)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                />
                <label
                  htmlFor={campusItem.id}
                  className="block ml-3 text-sm font-medium leading-6 text-gray-900"
                >
                  {campusItem.value}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
        <div className="mt-5">
          <button
            className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            type="submit"
          >
            Update Index Item
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminEditPageClient;
