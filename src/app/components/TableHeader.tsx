import React from 'react';

type TableHeaderProps = {
  requestSort: (key: string) => void;
  getClassNamesFor: (key: string) => string;
};

const TableHeader: React.FC<TableHeaderProps> = ({
  requestSort,
  getClassNamesFor
}) => (
  <div className="bg-gray-50 flex">
    <div
      className="w-1/12 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 cursor-pointer sm:pl-6"
      onClick={() => requestSort('id')}
    >
      ID <span className={getClassNamesFor('id')}></span>
    </div>
    <div
      className="w-4/12 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
      onClick={() => requestSort('title')}
    >
      Title <span className={getClassNamesFor('title')}></span>
    </div>
    <div
      className="w-1/12 py-3.5 text-center text-sm font-semibold text-gray-900 cursor-pointer"
      onClick={() => requestSort('letter')}
    >
      Letter <span className={getClassNamesFor('letter')}></span>
    </div>
    <div
      className="w-3/12 py-3.5 text-center text-sm font-semibold text-gray-900 cursor-pointer"
      onClick={() => requestSort('campus')}
    >
      Campus <span className={getClassNamesFor('campus')}></span>
    </div>
    <div className="w-3/12 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
      Actions <span className="text-gray-500">(hover row to view)</span>
    </div>
  </div>
);

export default React.memo(TableHeader);
