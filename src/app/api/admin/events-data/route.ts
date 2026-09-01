import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: tiers } = await supabaseAdmin
      .from('ticket_tiers')
      .select('*');

    const { data: tickets } = await supabaseAdmin
      .from('tickets')
      .select('*');

    return NextResponse.json({
      events: events || [],
      tiers: tiers || [],
      tickets: tickets || [],
    });
  } catch (error: any) {
    return NextResponse.json({
      events: [],
      tiers: [],
      tickets: [],
    });
  }
}
