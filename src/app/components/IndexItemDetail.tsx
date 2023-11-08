'use client'
type IndexItemProps = {
  indexItem: IndexItem
}
export default function IndexItemDetail({ indexItem }: IndexItemProps) {
  return <pre>{JSON.stringify(indexItem)}</pre>
}
