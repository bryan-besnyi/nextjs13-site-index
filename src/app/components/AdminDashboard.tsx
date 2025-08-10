import SearchFilters from './SearchFilters';
import DataTable from './DataTable';

type SearchResultType = {
  id: number;
  title: string;
  letter: string;
  campus: string;
  url: string;
};

interface AdminDashboardProps {
  initialData: SearchResultType[];
}

export default function AdminDashboard({ initialData }: AdminDashboardProps) {
  return (
    <>
      <SearchFilters />
      <DataTable initialData={initialData} />
    </>
  );
}