import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/auth/AuthProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Maumakan – Find Places to Eat',
  description:
    'Discover restaurants, cafes, and food stalls near you. Browse menus, check prices, and filter by rating and distance.',
  keywords: ['food map', 'restaurant finder', 'cafe', 'food stall', 'maumakan'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gray-950 text-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
