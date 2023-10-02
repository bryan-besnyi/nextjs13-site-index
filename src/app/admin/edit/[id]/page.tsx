import UpdateIndexItem from '@/app/components/UpdateIndexItem'

export default async function Page({ params: { id } }: Props) {
  return (
    <div className="prose">
      <h1>Edit Index Item</h1>
      <UpdateIndexItem id={id} />
    </div>
  )
}
