import './globals.css';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ConditionalLayout from './components/ConditionalLayout';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Site Index',
  description:
    'Browse and Discover Sites on the three San Mateo County Community College District colleges, College of San Mateo, Cañada College, and Skyline College!'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
