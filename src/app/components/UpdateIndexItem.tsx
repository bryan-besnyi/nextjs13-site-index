import { updateIndexItem, getIndexItem } from '@/lib/actions'

export default async function UpdateIndexItem() {
  const { IndexItem } = await getIndexItem()

  const content = (
    <form
      // action={updateIndexItem}
      className="flex flex-col max-w-lg gap-3"
    >
      <label
        htmlFor="title"
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        Title
      </label>
      <input
        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        type="text"
        id="title"
        name="title"
        defaultValue={IndexItem.title}
      />
      <label htmlFor="letter">Letter</label>
      <input
        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        type="text"
        id="letter"
        name="letter"
        defaultValue={IndexItem.letter}
      />
      <label htmlFor="url">URL</label>
      <input
        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        type="text"
        id="url"
        name="url"
        defaultValue={IndexItem.url}
      />
      <label htmlFor="campus">Campus</label>
      <fieldset>
        <legend className="text-base font-semibold leading-6 text-gray-900">
          Members
        </legend>
        <div className="mt-4 border-t border-b border-gray-200 divide-y divide-gray-200">
          <div className="relative flex items-start py-4">
            <div className="flex-1 min-w-0 text-sm leading-6">
              <label className="font-medium text-gray-900 select-none">
                District Office
              </label>
            </div>
            <div className="flex items-center h-6 ml-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-600"
              />
            </div>
          </div>
        </div>
      </fieldset>
      <select id="campus">
        <option value="all">All</option>
        <option value="csm">College of San Mateo</option>
        <option value="can">Canada</option>
        <option value="sky">Skyline</option>
      </select>
      <button type="submit" className="bg-slate-100">
        Submit
      </button>
    </form>
  )
  return content
}
