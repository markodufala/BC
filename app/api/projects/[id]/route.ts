import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 501 },
    );
  }

  const { data, error } = await supabase
    .from('projects')
    .select('data')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ project: (data as any).data });
}

export async function PUT(req: Request, { params }: Params) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 501 },
    );
  }

  const body = await req.json().catch(() => null);
  const project = body?.project;
  if (!project || project.id !== params.id) {
    return NextResponse.json(
      { error: 'Invalid payload' },
      { status: 400 },
    );
  }

  const { error } = await supabase.from('projects').upsert(
    {
      id: params.id,
      data: project,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 501 },
    );
  }

  const { error } = await supabase.from('projects').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

