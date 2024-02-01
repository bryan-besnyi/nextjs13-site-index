type IndexItemProps = {
  indexItem: {
    id: number
    title: string
    url: string
    campus: string
  }
}

export default function IndexItem({ indexItem }: IndexItemProps) {
  return (
    <li
      key={indexItem.id}
      className="flex justify-between px-2 py-3 text-indigo-600 border-b-2 border-blue-50"
    >
      <a href={indexItem.url}>{indexItem.title}</a>
      <span className="text-sm font-light text-gray-800">
        {indexItem.campus}
      </span>
    </li>
  )
}
