import SearchFilters from './SearchFilters';
import DataTable from './DataTable';
import { AdminDashboardProps } from '@/types';

export default function AdminDashboard({ initialData }: AdminDashboardProps) {
  return (
    <>
      <SearchFilters />
      <DataTable initialData={initialData} />
    </>
  );
}