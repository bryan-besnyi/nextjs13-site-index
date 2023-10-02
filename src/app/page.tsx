import { getIndexItems } from '@/lib/actions'

export default async function Home() {
  const { indexItems } = await getIndexItems()

  return (
    <div>
      <section className="py-8 bg-gray-100">
        <h1 className="sr-only">Site Index</h1>
        <div className="max-w-3xl p-8 mx-auto border rounded-lg shadow-lg border-blue-50 bg-gray-50">
          <label
            htmlFor="search"
            className="block text-lg font-medium leading-6 text-gray-900"
          >
            Quick search
          </label>
          <div className="relative flex items-center mt-2">
            <input
              type="text"
              name="search"
              id="search"
              className="block w-full rounded-md border-0 py-1.5 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
            <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
              <span className="inline-flex items-center px-1 font-sans text-xs text-gray-400 rounded">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.7}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </span>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-semibold text-center text-gray-800">
              Show results for...
            </label>
            <fieldset className="mt-2">
              <legend className="sr-only">
                Select the campus to filter results
              </legend>
              <div className="space-y-4 sm:flex sm:items-center sm:space-x-10 sm:space-y-0">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <input
                      name="notification-method"
                      type="radio"
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                    />
                    <label className="block ml-2 text-sm font-medium leading-6 text-gray-900">
                      Show All
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      name="notification-method"
                      type="radio"
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                    />
                    <label className="block ml-2 text-sm font-medium leading-6 text-gray-900">
                      College of San Mateo
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      name="notification-method"
                      type="radio"
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                    />
                    <label className="block ml-2 text-sm font-medium leading-6 text-gray-900">
                      Cañada College
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      name="notification-method"
                      type="radio"
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                    />
                    <label className="block ml-2 text-sm font-medium leading-6 text-gray-900">
                      Skyline College
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      name="notification-method"
                      type="radio"
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                    />
                    <label className="block ml-2 text-sm font-medium leading-6 text-gray-900">
                      District Office
                    </label>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
      </section>
      <section className="container flow-root py-8 mx-auto">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg"></div>
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 text-center"
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
                    Item URL
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Campus
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {indexItems?.map((indexItem) => (
                  <tr key={indexItem.id}>
                    <td className="px-3 py-2 text-sm text-center text-gray-800 whitespace-nowrap">
                      {indexItem.id}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-800 whitespace-nowrap">
                      {indexItem.title}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-800 whitespace-nowrap">
                      {indexItem.letter.toUpperCase()}
                    </td>
                    <td className="text-indigo-800">
                      <a className="ml-3" href={indexItem.url}>
                        {indexItem.url}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-800 whitespace-nowrap">
                      {indexItem.campus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
