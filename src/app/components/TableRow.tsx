import React from 'react';
import Link from 'next/link';
import DeleteButton from './DeleteButton';

type TableRowProps = {
  item: {
    id: number;
    title: string;
    letter: string;
    campus: string;
    url: string;
  };
  style: React.CSSProperties;
};

const TableRow: React.FC<TableRowProps> = ({ item, style }) => (
  <div
    style={style}
    className="flex items-center border-b-2 group hover:bg-gray-100 border-b-slate-100"
    role="row"
    aria-rowindex={item.id}
  >
    <div className="w-1/12 px-6 py-3 whitespace-nowrap" role="cell">
      <div className="text-sm font-medium text-gray-900">{item.id}</div>
    </div>
    <div className="w-4/12 py-3 text-left whitespace-nowrap" role="cell">
      <div className="flex items-start text-sm font-medium text-gray-900">
        <Link
          href={`/admin/edit/${item.id}`}
          className="hover:underline hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded"
          aria-label={`Edit ${item.title}`}
        >
          {item.title}
        </Link>
        <a
          href={item.url}
          aria-label={`View ${item.title} on production site`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 hover:text-indigo-700"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        </a>
      </div>
    </div>
    <div className="w-1/12 py-3 text-center whitespace-nowrap" role="cell">
      <div className="text-sm font-medium text-gray-900">
        {item.letter.toUpperCase()}
      </div>
    </div>
    <div className="w-3/12 px-4 py-3 whitespace-nowrap" role="cell">
      <div className="text-sm font-medium text-center text-gray-900">
        {item.campus}
      </div>
    </div>
    <div className="w-3/12 px-3 py-3 whitespace-nowrap" role="cell">
      <div className="flex items-center space-x-2">
        <Link
          className="px-3 py-1 text-sm font-semibold text-indigo-900 transition-opacity duration-100 bg-indigo-200 rounded shadow-sm opacity-0 group-hover:opacity-100 hover:bg-indigo-300 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          href={`/admin/edit/${item.id}`}
          aria-label={`Edit ${item.title}`}
        >
          Edit Item <span aria-hidden="true">✏️</span>
        </Link>
        <div className="transition-opacity duration-100 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
          <DeleteButton id={Number(item.id)} itemName={item.title} />
        </div>
      </div>
    </div>
  </div>
);

export default React.memo(TableRow);
