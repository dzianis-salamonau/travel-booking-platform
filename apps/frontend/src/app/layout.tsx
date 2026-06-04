import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'TravelBook | Package Holidays & Beach Deals',
  description: 'Search and compare package holidays to Spain, Portugal, Cape Verde and more. Live availability, flexible deposits, trusted providers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
