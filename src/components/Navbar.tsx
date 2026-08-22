import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="border-b border-neutral-800 bg-black/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-lg font-black tracking-widest text-yellow-400">
          • OASIS.
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/my-tickets"
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-1.5"
          >
            <span>🎟</span> Mis Entradas
          </Link>
          <Link
            href="/admin"
            className="text-xs font-mono text-neutral-400 hover:text-white transition-colors px-3 py-2"
          >
            Backstage
          </Link>
        </div>
      </div>
    </nav>
  );
}