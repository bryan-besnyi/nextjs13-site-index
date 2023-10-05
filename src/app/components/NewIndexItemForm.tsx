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
    <form className="flex flex-col max-w-3xl" action={action}>
      <label htmlFor="title">Title</label>
      <input type="text" name="title" className="border-2 shadow-sm" />
      <label htmlFor="letter">Letter</label>
      <input type="text" name="letter" className="border-2 shadow-sm" />
      <label htmlFor="url">URL</label>
      <input type="text" name="url" className="border-2 shadow-sm" />
      <label htmlFor="campus">Campus</label>
      <input type="text" name="campus" className="border-2 shadow-sm" />
      <button type="submit">Add Index Item</button>
    </form>
  )
}

export default NewIndexItemForm
