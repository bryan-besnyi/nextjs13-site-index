import { getIndexItems } from '@/lib/indexItems';
import SearchResults from '@/components/SearchResults';

export default async function AdminPage() {
  const { indexItems } = await getIndexItems();
  return (
    <div>
      <h1 className="p-5 text-3xl font-bold bg-slate-200">Admin Home</h1>
      <SearchResults />
    </div>
  );
}
