import './globals.css';
import CursorGlow from '@/components/fx/CursorGlow';

export const metadata = {
  title: 'Live Experience | Event Tickets',
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
        <CursorGlow />
        {children}
      </body>
    </html>
  );
}
