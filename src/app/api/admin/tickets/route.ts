import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/core/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('*, events(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tickets: tickets || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}