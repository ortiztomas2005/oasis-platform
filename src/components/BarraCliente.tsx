'use client';

import React, { useState } from 'react';
import CheckoutBarra from './CheckoutBarra';

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  esPromo?: boolean;
  descuento?: number;
}

export default function BarraCliente() {
  // Simulación de entradas compradas para el evento (DNI habilitados)
  const [ticketsValidos] = useState<string[]>(['40123456', '12345678', '99999999']);
  
  const [dniValidado, setDniValidado] = useState<string | null>(null);
  const [dniInput, setDniInput] = useState('');
  const [errorTicket, setErrorTicket] = useState(false);

  const [productos] = useState<Producto[]>([
    { id: 1, nombre: 'PROMO 2X FERNET + ICE', categoria: 'PROMOS Y COMBOS', precio: 8000, stock: 20, esPromo: true, descuento: 20 },
    { id: 2, nombre: 'FERNET 750ML', categoria: 'BEBIDAS CON ALCOHOL', precio: 5000, stock: 45 },
    { id: 3, nombre: 'AGUA MINERAL 500ML', categoria: 'BEBIDAS SIN ALCOHOL', precio: 2000, stock: 8 },
    { id: 4, nombre: 'CERVEZA TIRADA 500CC', categoria: 'BEBIDAS CON ALCOHOL', precio: 3500, stock: 100 },
  ]);

  const [carrito, setCarrito] = useState<{ [key: number]: number }>({});
  const [enCheckout, setEnCheckout] = useState(false);

  // Validar si el cliente tiene ticket para el evento
  const verificarEntrada = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketsValidos.includes(dniInput.trim())) {
      setDniValidado(dniInput.trim());
      setErrorTicket(false);
    } else {
      setErrorTicket(true);
    }
  };

  const modificarCantidad = (id: number, cambio: number, stockDisponible: number) => {
    const cantidadActual = carrito[id] || 0;
    const nuevaCantidad = cantidadActual + cambio;

    if (nuevaCantidad < 0 || nuevaCantidad > stockDisponible) return;

    setCarrito({
      ...carrito,
      [id]: nuevaCantidad
    });
  };

  const totalItems = Object.values(carrito).reduce((acc, qty) => acc + qty, 0);
  const totalPrecio = productos.reduce((acc, prod) => {
    const cantidad = carrito[prod.id] || 0;
    return acc + prod.precio * cantidad;
  }, 0);

  // Si no validó su entrada, le mostramos la pantalla de Verificación de Ticket
  if (!dniValidado) {
    return (
      <div className="min-h-screen bg-black text-white p-4 font-sans max-w-md mx-auto border-x border-zinc-900 flex flex-col justify-center">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl flex items-center justify-center mx-auto text-yellow-400 text-xl font-mono">
            🎟️
          </div>

          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">• OASIS ACCESS CONTROL</span>
            <h2 className="text-lg font-black text-white tracking-wider uppercase mt-1">
              VERIFICACIÓN DE ENTRADA
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Ingresá tu DNI para verificar tu ticket del evento y habilitar la compra en barra.
            </p>
          </div>

          <form onSubmit={verificarEntrada} className="space-y-3">
            <input
              type="number"
              placeholder="Ingresá tu DNI (Ej: 40123456)"
              value={dniInput}
              onChange={(e) => setDniInput(e.target.value)}
              className="w-full bg-black border border-zinc-800 text-white p-3.5 rounded-xl text-center font-mono text-sm focus:border-yellow-400 focus:outline-none"
              required
            />

            {errorTicket && (
              <p className="text-xs text-rose-400 font-mono bg-rose-950/40 p-2 rounded-lg border border-rose-800">
                ❌ No se encontró una entrada válida asociada a este DNI.
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black p-3.5 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              ACCEDER A LA BARRA
            </button>
          </form>

          <p className="text-[10px] font-mono text-zinc-600">
            * Para pruebas podés ingresar el DNI: <span className="text-yellow-400 font-bold">40123456</span>
          </p>
        </div>
      </div>
    );
  }

  if (enCheckout) {
    return (
      <CheckoutBarra
        totalPrecio={totalPrecio}
        totalItems={totalItems}
        onVolver={() => setEnCheckout(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-28 font-sans max-w-md mx-auto border-x border-zinc-900">
      
      {/* HEADER OASIS */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 pt-2">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">• OASIS BARRA DIGITAL</span>
          <h1 className="text-xl font-black text-yellow-400 tracking-wider">MENÚ DE CONSUMOS</h1>
        </div>
        <div className="flex flex-col items-end">
          <span className="bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
            ✓ TICKET HABILITADO
          </span>
          <span className="text-[10px] font-mono text-zinc-500 mt-1">DNI: {dniValidado}</span>
        </div>
      </div>

      {/* LISTADO DE CONSUMIBLES Y PROMOS */}
      <div className="mt-6 space-y-4">
        {productos.map((prod) => {
          const cantidad = carrito[prod.id] || 0;
          return (
            <div
              key={prod.id}
              className={`border rounded-2xl p-4 flex items-center justify-between shadow-lg transition-all ${
                prod.esPromo
                  ? 'bg-zinc-950 border-yellow-400/50 shadow-yellow-400/5'
                  : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full uppercase">
                    {prod.categoria}
                  </span>
                  {prod.esPromo && (
                    <span className="text-[9px] font-mono text-black font-bold bg-yellow-400 px-2 py-0.5 rounded-full uppercase">
                      🔥 PROMO {prod.descuento}% OFF
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-white tracking-wide mt-1">{prod.nombre}</h3>
                <p className="text-yellow-400 font-mono font-bold text-base">
                  ${prod.precio.toLocaleString('es-AR')}
                </p>
              </div>

              {/* CONTROLES + / - */}
              <div className="flex items-center bg-black border border-zinc-800 rounded-xl p-1 gap-3">
                <button
                  onClick={() => modificarCantidad(prod.id, -1, prod.stock)}
                  className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-300 font-bold flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all text-lg"
                >
                  -
                </button>
                <span className="font-mono font-bold text-sm min-w-[16px] text-center text-white">
                  {cantidad}
                </span>
                <button
                  onClick={() => modificarCantidad(prod.id, 1, prod.stock)}
                  className="w-8 h-8 rounded-lg bg-yellow-400 text-black font-bold flex items-center justify-center hover:bg-yellow-300 active:scale-95 transition-all text-lg"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTÓN FLOTANTE */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-50">
          <button
            onClick={() => setEnCheckout(true)}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black p-4 rounded-2xl shadow-2xl shadow-yellow-400/20 flex items-center justify-between transition-all transform active:scale-98"
          >
            <div className="flex items-center gap-2">
              <span className="bg-black text-yellow-400 text-xs font-mono font-bold px-2.5 py-1 rounded-full">
                {totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'}
              </span>
              <span className="text-xs uppercase font-bold tracking-wider">COMPRAR AHORA</span>
            </div>
            <span className="text-lg font-mono font-bold">
              ${totalPrecio.toLocaleString('es-AR')}
            </span>
          </button>
        </div>
      )}

    </div>
  );
}