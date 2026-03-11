import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 501 },
    );
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id,data,updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    projects: (data ?? []).map((row: any) => row.data),
  });
}

