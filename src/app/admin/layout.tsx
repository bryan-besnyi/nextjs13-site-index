import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import ErrorBoundary from '@/components/admin/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Admin Dashboard | SMCCCD Site Index',
  description: 'Advanced administration tools for College Web Developers'
};

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  // Authentication check
  if (!session?.user?.email && process.env.NODE_ENV === 'production') {
    redirect('/');
  }
  
  return (
    <ErrorBoundary>
      <AdminLayoutClient>
        {children}
      </AdminLayoutClient>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: '',
          duration: 4000,
          error: {
            duration: 6000,
            style: {
              background: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FECACA',
            },
          },
          success: {
            style: {
              background: '#ECFDF5',
              color: '#059669',
              border: '1px solid #BBF7D0',
            },
          },
        }}
      />
    </ErrorBoundary>
  );
}
