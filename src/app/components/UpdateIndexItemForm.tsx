'use client'

import { updateIndexItemAction } from '../_actions'
import { revalidatePath } from 'next/cache'
import { useRouter } from 'next/router'

const UpdateIndexItemForm = () => {
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    const id = Number(data.get('id'))
    const title = data.get('title').toString()
    const url = data.get('url').toString()
    const letter = data.get('letter').toString()
    const campus = data.get('campus').toString()

    try {
      await updateIndexItemAction(id, title, url, letter, campus)
      revalidatePath('/admin')

      router.push('/admin')
    } catch (error) {
      console.error('Failed to update index item:', error)
    }
  }

  return (
    <form action="/api/updateIndexItem" method="POST">
      <label htmlFor="title">Title</label>
      <input type="text" name="title" id="title" className="border-2" />
      <label htmlFor="letter">Letter</label>
      <input type="text" name="letter" id="letter" className="border-2" />
      <label htmlFor="url">URL</label>
      <input type="text" name="url" id="url" className="border-2" />
      <label htmlFor="campus">Campus</label>
      <select name="campus" id="campus" className="border-2">
        <option value="CAN">Cañada College</option>
        <option value="CSM">College of San Mateo</option>
        <option value="DO">District Office</option>
        <option value="SKY">Skyline College</option>
      </select>
      <button type="submit">Update Index Item</button>
    </form>
  )
}

export default UpdateIndexItemForm
