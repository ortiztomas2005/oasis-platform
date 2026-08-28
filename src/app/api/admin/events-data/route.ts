import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [eventsRes, ordersRes, ticketsRes] = await Promise.all([
      supabaseAdmin.from('events').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('tickets').select('*').order('created_at', { ascending: false }),
    ]);

    if (eventsRes.error) throw eventsRes.error;

    return NextResponse.json({
      events: eventsRes.data || [],
      orders: ordersRes.data || [],
      tickets: ticketsRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}