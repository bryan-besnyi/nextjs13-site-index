import NewIndexItemForm from '../../components/NewIndexItemForm'

export default function Page() {
  return (
    <div>
      <h1 className="p-5 text-3xl font-bold bg-slate-200">Create New</h1>
      <div className="p-5">
        <NewIndexItemForm />
      </div>
    </div>
  )
}
