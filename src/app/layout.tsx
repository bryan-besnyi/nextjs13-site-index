import './globals.css'
import { Inter } from 'next/font/google'
import Provider from './components/Provider'
import Header from './components/Header'
import Footer from './components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Site Index',
  description:
    'Browse and Discover Sites on SMCCD colleges, College of San Mateo, Cañada College, and Skyline College!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
