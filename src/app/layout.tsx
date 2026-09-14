import './globals.css';

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
      <body className="bg-[#05070d] text-white">{children}</body>
    </html>
  );
}
