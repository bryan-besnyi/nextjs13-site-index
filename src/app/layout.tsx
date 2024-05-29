import './globals.css';
import { Inter } from 'next/font/google';
import Header from './components/Header';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Site Index',
  description:
    'Browse and Discover Sites on SMCCD colleges, College of San Mateo, Cañada College, and Skyline College!'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="bg-gray-50">{children}</main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
