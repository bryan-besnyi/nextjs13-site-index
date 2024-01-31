import NewIndexItemForm from '../../components/NewIndexItemForm'

export default function Page() {
  return (
    <div>
      <h1 className="p-8 text-3xl font-bold bg-slate-100">
        Create New Index Item
      </h1>
      <div className="px-8 py-6">
        <NewIndexItemForm />
      </div>
    </div>
  )
}
