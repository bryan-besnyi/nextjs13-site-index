'use client'

export default function DeleteButton() {
  const handleClick = () => {
    alert('Are you sure you want to delete?')
  }

  return (
    <button className="py-4" onClick={handleClick}>
      Delete
    </button>
  )
}
