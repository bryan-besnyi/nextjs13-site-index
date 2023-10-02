import { getIndexItems } from '@/lib/actions'
import Link from 'next/link'

export default async function AdminPage() {
  const { indexItems } = await getIndexItems()

  return (
    <div className="mt-5">
      <h1 className="mb-2 text-2xl">Admin Home</h1>
      <table className="min-w-full divide-y divide-gray-300">
        {indexItems.map((item) => (
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
            <td>
              <Link href={`/admin/edit/${item.id}`}>Edit</Link>
            </td>
            <td className="font-semibold text-red-400 underline">
              {/* TODO add client component to delete index item */}Delete
            </td>
          </tr>
        ))}
      </table>
    </div>
  )
}
