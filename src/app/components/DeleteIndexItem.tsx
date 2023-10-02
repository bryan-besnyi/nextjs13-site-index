import { deleteIndexItem } from '@/lib/actions'

export function DeleteIndexItemModal({ deleteIndexItem }) {
  return (
    <button
      onClick={async () => {
        await deleteIndexItem()
        alert('item has been deleted')
      }}
    >
      Delete
    </button>
  )
}
