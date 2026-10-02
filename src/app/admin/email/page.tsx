'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface EmailSettings {
  contact_email?: string | null;
  email_logo_url?: string | null;
  email_brand_color?: string | null;
  email_footer_text?: string | null;
  email_extra_info?: string | null;
}

export default function EmailBrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [contactEmail, setContactEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('');
  const [footerText, setFooterText] = useState('');
  const [extraInfo, setExtraInfo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/producers/email-settings');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar la configuración');
      const s: EmailSettings = data.settings || {};
      setContactEmail(s.contact_email || '');
      setLogoUrl(s.email_logo_url || '');
      setBrandColor(s.email_brand_color || '');
      setFooterText(s.email_footer_text || '');
      setExtraInfo(s.email_extra_info || '');
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch('/api/producers/email-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactEmail,
          logoUrl,
          brandColor,
          footerText,
          extraInfo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 sm:p-10 font-mono">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest block">
              Personalización
            </span>
            <h1 className="text-2xl font-black uppercase text-white">Mail de confirmación</h1>
          </div>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-white">
            ← Volver al panel
          </Link>
        </div>

        <p className="text-[11px] text-neutral-500 leading-relaxed">
          Esto personaliza el mail con el QR que recibe cada cliente al comprar una entrada. El remitente técnico
          sigue siendo el dominio de Live Experience (ningún proveedor de email deja mandar "desde" el dominio de un
          tercero sin que lo verifique), pero el nombre que ve el cliente y las respuestas a ese mail sí van a tu
          productora.
        </p>

        {loading ? (
          <p className="text-xs text-neutral-500">Cargando...</p>
        ) : (
          <form onSubmit={handleSave} className="bg-[#0c0f16] border border-white/10 rounded-2xl p-5 space-y-5">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                ⚠️ {error}
              </div>
            )}
            {saved && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs">
                ✅ Guardado
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-neutral-400">Email de contacto (Reply-To)</label>
              <input
                type="email"
                placeholder="contacto@tuproductora.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-neutral-500">Si el cliente responde el mail, le llega acá.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-neutral-400">Logo (URL)</label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-neutral-500">Si lo dejás vacío, se usa el logo de Live Experience.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-neutral-400">Color de marca</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : '#facc15'}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-white/10 bg-black/60 cursor-pointer"
                />
                <input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#facc15"
                  className="flex-1 px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-neutral-400">
                Información importante (cómo llegar, cómo es el ingreso)
              </label>
              <textarea
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder={'Ej: Entrada por Av. Siempreviva 742.\nDNI obligatorio en puerta.\nNo se permite reingreso.'}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500 resize-y"
              />
              <p className="text-[10px] text-neutral-500">
                Se muestra como un bloque aparte en el mail, debajo del QR. {extraInfo.length}/2000
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-neutral-400">Pie del mail</label>
              <textarea
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Ej: Consultas: @tuproductora en Instagram"
                className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500 resize-y"
              />
              <p className="text-[10px] text-neutral-500">{footerText.length}/300</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-black font-black uppercase text-xs tracking-wide transition active:scale-95"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
