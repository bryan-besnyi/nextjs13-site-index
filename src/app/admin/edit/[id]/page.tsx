import { getIndexItemById } from '@/lib/indexItems'
import UpdateIndexItemForm from '@/components/UpdateIndexItemForm'

const Page = ({ id }) => {
  const indexItem = getIndexItemById(id)
  console.log(indexItem)
  return (
    <div>
      <h1>Edit Index Item</h1>
      <UpdateIndexItemForm indexItem={indexItem} />
    </div>
  )
}

export default Page
