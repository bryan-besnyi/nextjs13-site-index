import SessionProvider from '../components/SessionProvider';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Admin Area | Site Index'
};

const Sidebar = () => {
  return (
    <div className="flex flex-col w-64 h-screen px-4 py-8 text-lg bg-gray-100 border-r dark:bg-gray-800 dark:border-gray-600">
      <nav>
        <ul className="flex flex-col gap-3 pl-5 text-gray-200">
          <li>
            <Link href="/admin">Admin Home</Link>
          </li>
          <li>
            <Link href="/admin/new">Create New</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  /**
   * Retrieves the server session.
   * @returns {Promise<Session>} A promise that resolves to the server session.
   */
  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect('/');
  }
  return (
    <SessionProvider>
      <div className="flex flex-row">
        <Sidebar />
        <main className="w-full">{children}</main>
      </div>
    </SessionProvider>
  );
}
