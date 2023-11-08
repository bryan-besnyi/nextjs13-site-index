'use client'

import { createIndexItemAction } from '../_actions'

const NewIndexItemForm = () => {
  async function action(data: FormData) {
    const title = data.get('title')
    if (typeof title !== 'string' || !title) return
    const url = data.get('url')
    if (typeof url !== 'string' || !url) return
    const letter = data.get('letter')
    if (typeof letter !== 'string' || !letter) return
    const campus = data.get('campus')
    if (typeof campus !== 'string' || !campus) return

    await createIndexItemAction(title, url, letter, campus)
  }

  return (
    <form className="flex flex-col max-w-3xl gap-3" action={action}>
      <label
        htmlFor="title"
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        Title
      </label>
      <input
        id="title"
        type="text"
        name="title"
        className="shadow-sm border-1"
      />
      <label className="mt-3" htmlFor="letter">
        Letter
      </label>
      <input
        id="letter"
        type="text"
        name="letter"
        className="shadow-sm border-1"
      />
      <label className="mt-3" htmlFor="url">
        URL
      </label>
      <input id="url" type="text" name="url" className="shadow-sm border-1" />
      <label className="mt-3" htmlFor="campus">
        Campus
      </label>
      <select
        id="campus"
        name="campus"
        className="shadow-sm border-1"
        required={true}
      >
        <option value="CAN">Cañada College</option>
        <option value="CSM">College of San Mateo</option>
        <option value="DO">District Office</option>
        <option value="SKY">Skyline College</option>
      </select>
      <button
        type="submit"
        className="w-64 px-3 py-2 mt-5 text-white bg-indigo-800 rounded-md shadow-md"
      >
        Add Index Item
      </button>
    </form>
  )
}

export default NewIndexItemForm
