import SessionProvider from '../components/SessionProvider';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { CirclePlus, HomeIcon } from 'lucide-react';

export const metadata = {
  title: 'Administration Area | SMCCCD Site Index'
};

const Sidebar = () => {
  return (
    <div className="flex flex-col w-56 text-lg border-r flex-0 bg-gray-800">
      <nav>
        <ul className="flex flex-col mt-4 gap-3 text-gray-200">
          <li className="rounded mx-4 flex-1 p-2 hover:underline hover:bg-gray-200 hover:text-gray-900">
            <Link className="block text-left" href="/admin">
              <HomeIcon
                aria-hidden="true"
                className="inline-block w-6 h-6 mr-2"
              />
              Home
            </Link>
          </li>
          <li className="flex-1 rounded mx-4 p-2 hover:underline hover:bg-gray-200 hover:text-gray-900">
            <Link className="block text-left" href="/admin/new">
              <CirclePlus
                aria-hidden="true"
                className="inline-block w-6 h-6 mr-2"
              />
              Create New
            </Link>
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
  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect('/');
  }
  return (
    <SessionProvider>
      <div className="flex flex-row min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </SessionProvider>
  );
}
