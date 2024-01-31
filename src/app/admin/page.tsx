import { getIndexItems } from '@/lib/indexItems'
import Link from 'next/link'

export default async function AdminPage() {
  const { indexItems } = await getIndexItems()

  return (
    <div>
      <h1 className="p-5 text-3xl font-bold bg-slate-200">Admin Home</h1>
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
                {item.title}
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
            <td className="font-semibold text-red-400 underline">Delete</td>
          </tr>
        ))}
      </table>
    </div>
  )
}
