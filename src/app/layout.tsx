import './globals.css';
import CursorGlow from '@/components/fx/CursorGlow';
import MobileNavIsland from '@/components/fx/MobileNavIsland';

export const metadata = {
  title: 'Live Experience | Event Tickets',
  description: 'Plataforma oficial de eventos y tickets',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // Nunca deshabilitar el pinch-to-zoom del usuario (maximumScale: 1 o
  // userScalable: false) — es una barrera de accesibilidad real para
  // cualquiera que necesite agrandar texto.
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      {/* pb-24 deja lugar para que la isla de navegación flotante no tape
          el final del contenido en mobile — en desktop (md:pb-0) no hace
          falta porque ahí la isla no se muestra. */}
      <body className="bg-[#05070d] text-white pb-24 md:pb-0">
        <CursorGlow />
        {children}
        <MobileNavIsland />
      </body>
    </html>
  );
}
