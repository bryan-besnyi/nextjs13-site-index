import { getIndexItems } from '@/lib/indexItems';
import SearchResults from '@/components/SearchResults';

export default async function AdminPage() {
  'use client';
  const { indexItems } = await getIndexItems();

  return (
    <div>
      <h1 className="p-5 text-3xl font-bold bg-slate-200">Admin Home</h1>
      <SearchResults />
      {/* <div className="flex items-center justify-center w-full p-5 bg-slate-600">
        <label className="text-white sr-only" htmlFor="Search">
          Search for Index Items
        </label>
        <input
          type="text"
          placeholder="Search"
          className="flex-grow p-3 mr-2"
        />
        <button className="max-w-xl p-3 bg-slate-200">Search</button>
      </div>
      <table className="min-w-full divide-y divide-gray-300">
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
        {indexItems?.map((item) => (
          <tr key={item.id}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">{item.id}</div>
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
            <DeleteButton />
          </tr>
        ))}
      </table> */}
    </div>
  );
}
