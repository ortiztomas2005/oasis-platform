import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OASIS | Plataforma Oficial de Tickets & Acceso',
  description: 'Plataforma oficial de acreditación directa, validación criptográfica y mercado secundario verificado.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-[#050811] text-white min-h-screen antialiased selection:bg-blue-600 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}