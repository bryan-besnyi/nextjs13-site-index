'use client'
import prisma from '@/utils/db'

// display alert and remove item from the page using Prisma
export default function DeleteButton() {
  const handleClick = () => {
    alert('Are you sure you want to delete?')

    // Remove the item from the page

    // Remove the item from the database
    // async function deleteItem() {
    //   'use server'
    //   await prisma.indexItem.delete({
    //     where: { id: indexItem.id },
    //   })
    // }
  }

  return (
    <button className="py-4" onClick={handleClick}>
      Delete
    </button>
  )
}
