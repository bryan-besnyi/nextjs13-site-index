'use client'

import { updateIndexItemAction } from '../_actions'

const UpdateIndexItemForm = () => {
  async function action(event: React.FormEvent<HTMLFormElement>) {
    const title = data.get('title')
    if (typeof title !== 'string' || !title) return
    const url = data.get('url')
    if (typeof url !== 'string' || !url) return
    const letter = data.get('letter')
    if (typeof letter !== 'string' || !letter) return
    const campus = data.get('campus')
    if (typeof campus !== 'string' || !campus) return

    await updateIndexItemAction(id, title, url, letter, campus)
  }

  return (
    <form action={action}>
      <input type="text" name="title" className="border-2" />
      <input type="text" name="letter" className="border-2" />
      <input type="text" name="url" className="border-2" />
      <select className="border-2">
        <option value="district-office">District Office</option>
        <option value="college-of-san-mateo">College of San Mateo</option>
      </select>
      <button type="submit">Update Index Item</button>
    </form>
  )
}

export default UpdateIndexItemForm
