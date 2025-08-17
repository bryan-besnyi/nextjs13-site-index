import React from 'react';

type TableHeaderProps = {
  requestSort: (key: string) => void;
  getClassNamesFor: (key: string) => string;
};

const TableHeader: React.FC<TableHeaderProps> = ({
  requestSort,
  getClassNamesFor
}) => {
  const getSortLabel = (key: string, currentSort: string) => {
    const direction = currentSort.includes('asc') ? 'ascending' : currentSort.includes('desc') ? 'descending' : 'not sorted';
    const nextDirection = currentSort.includes('asc') ? 'descending' : 'ascending';
    return `Sort by ${key}, currently ${direction}, click to sort ${nextDirection}`;
  };

  return (
    <div className="bg-gray-50 flex" role="row">
      <button
        className="w-1/12 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-100 sm:pl-6"
        onClick={() => requestSort('id')}
        aria-label={getSortLabel('ID', getClassNamesFor('id'))}
        role="columnheader"
        aria-sort={getClassNamesFor('id').includes('asc') ? 'ascending' : getClassNamesFor('id').includes('desc') ? 'descending' : 'none'}
      >
        ID <span className={getClassNamesFor('id')} aria-hidden="true"></span>
      </button>
      <button
        className="w-4/12 py-3.5 text-left text-sm font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-100"
        onClick={() => requestSort('title')}
        aria-label={getSortLabel('Title', getClassNamesFor('title'))}
        role="columnheader"
        aria-sort={getClassNamesFor('title').includes('asc') ? 'ascending' : getClassNamesFor('title').includes('desc') ? 'descending' : 'none'}
      >
        Title <span className={getClassNamesFor('title')} aria-hidden="true"></span>
      </button>
      <button
        className="w-1/12 py-3.5 text-center text-sm font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-100"
        onClick={() => requestSort('letter')}
        aria-label={getSortLabel('Letter', getClassNamesFor('letter'))}
        role="columnheader"
        aria-sort={getClassNamesFor('letter').includes('asc') ? 'ascending' : getClassNamesFor('letter').includes('desc') ? 'descending' : 'none'}
      >
        Letter <span className={getClassNamesFor('letter')} aria-hidden="true"></span>
      </button>
      <button
        className="w-3/12 py-3.5 text-center text-sm font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-100"
        onClick={() => requestSort('campus')}
        aria-label={getSortLabel('Campus', getClassNamesFor('campus'))}
        role="columnheader"
        aria-sort={getClassNamesFor('campus').includes('asc') ? 'ascending' : getClassNamesFor('campus').includes('desc') ? 'descending' : 'none'}
      >
        Campus <span className={getClassNamesFor('campus')} aria-hidden="true"></span>
      </button>
      <div className="w-3/12 px-3 py-3.5 text-left text-sm font-semibold text-gray-900" role="columnheader">
        Actions <span className="text-gray-500 text-xs">(available on hover)</span>
      </div>
    </div>
  );
};

export default React.memo(TableHeader);
