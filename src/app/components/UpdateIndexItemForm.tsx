'use client'

import { updateIndexItemAction } from '../_actions'

const UpdateIndexItemForm = () => {
  async function action(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget)
    const id = Number(data.get('id'))
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
    <form action="/api/updateIndexItem" method="POST" onSubmit={action}>
      <label htmlFor="title">Title</label>
      <input type="text" name="title" id="title" className="border-2" />
      <label htmlFor="letter">Letter</label>
      <input type="text" name="letter" id="letter" className="border-2" />
      <label htmlFor="url">URL</label>
      <input type="text" name="url" id="url" className="border-2" />
      <label htmlFor="campus">Campus</label>
      <select name="campus" id="campus" className="border-2">
        <option value="district-office">District Office</option>
        <option value="college-of-san-mateo">College of San Mateo</option>
        <option value="canada-college">Cañada College</option>
        <option value="skyline-college">Skyline College</option>
      </select>
      <button type="submit">Update Index Item</button>
    </form>
  )
}

export default UpdateIndexItemForm
