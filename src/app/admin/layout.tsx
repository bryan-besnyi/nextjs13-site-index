import Provider from '../components/Provider'
import Link from 'next/link'

export const metadata = {
  title: 'Admin Area | Site Index',
}

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
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // if no session, display login button
  // if session, display logout button
  return (
    <Provider>
      <div className="flex flex-row">
        <Sidebar />
        <main className="w-full">{children}</main>
      </div>
    </Provider>
  )
}
