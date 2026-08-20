import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OASIS | Ticketing & High-Volume Access',
  description: 'Plataforma oficial de eventos y venta de entradas OASIS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 min-h-screen flex flex-col`}>
        <Navbar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}