import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'OASIS | Event Tickets',
  description: 'Plataforma oficial de eventos y tickets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#05070d] text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
