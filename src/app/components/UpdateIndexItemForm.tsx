'use client'
import { useState, useEffect } from 'react'
import { updateIndexItemAction } from '../_actions'

const UpdateIndexItemForm = ({ indexItem }) => {
  const [formData, setFormData] = useState({
    title: '',
    letter: '',
    url: '',
    campus: '',
  })

  useEffect(() => {
    setFormData({
      title: indexItem.title,
      letter: indexItem.letter,
      url: indexItem.url,
      campus: indexItem.campus,
    })
  }, [indexItem])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault() // Prevent form submission

    const { title, url, letter, campus } = formData

    if (!title || !url || !letter || !campus) return

    await updateIndexItemAction(indexItem.id, title, url, letter, campus)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
        className="border-2"
      />
      <input
        type="text"
        name="letter"
        value={formData.letter}
        onChange={handleChange}
        className="border-2"
      />
      <input
        type="text"
        name="url"
        value={formData.url}
        onChange={handleChange}
        className="border-2"
      />
      <input
        type="text"
        name="campus"
        value={formData.campus}
        onChange={handleChange}
        className="border-2"
      />
      <button type="submit">Update Index Item</button>
    </form>
  )
}

export default UpdateIndexItemForm
