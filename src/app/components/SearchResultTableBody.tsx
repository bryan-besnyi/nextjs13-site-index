import Link from 'next/link';
import DeleteButton from './DeleteButton';
import { Suspense } from 'react';

const TableContent = ({ searchResults }: { searchResults: any[] }) => (
  <tbody>
    <Suspense fallback={<div>Loading...</div>}>
      {searchResults.map((item) => (
        <tr
          key={item.id}
          className="border-b-2 group hover:bg-gray-100 border-b-slate-100"
        >
          <td className="px-6 py-3 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">{item.id}</div>
          </td>
          <td className="py-3 text-left whitespace-nowrap">
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
                rel="noopener noreferrer"
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
          <td className="py-3 text-center whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">
              {item.letter.toUpperCase()}
            </div>
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <div className="text-sm font-medium text-center text-gray-900">
              {item.campus}
            </div>
          </td>
          <td className="px-3 py-3 whitespace-nowrap">
            <div className="flex items-center space-x-2">
              <Link
                className="px-3 py-1 text-sm font-semibold text-indigo-900 transition-opacity duration-100 bg-indigo-200 rounded shadow-sm opacity-0 group-hover:opacity-100 hover:bg-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                href={`/admin/edit/${item.id}`}
              >
                Edit Item ✏️
              </Link>
              <div className="transition-opacity duration-100 opacity-0 group-hover:opacity-100">
                <DeleteButton id={Number(item.id)} itemName={item.title} />
              </div>
            </div>
          </td>
        </tr>
      ))}
    </Suspense>
  </tbody>
);

export default TableContent;
