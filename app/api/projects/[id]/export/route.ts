import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import type { Project } from '@/lib/types';
import { migrateProject } from '@/lib/validation';
import { exportProjectToOaisZip } from '@/lib/projectZip';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return new Response('Supabase is not configured', { status: 501 });
  }

  const { data, error } = await supabase
    .from('projects')
    .select('data')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  if (!data) {
    return new Response('Not found', { status: 404 });
  }

  const project = migrateProject((data as any).data as Project);

  const zip = await exportProjectToOaisZip(project);
  const content = await zip.generateAsync({ type: 'nodebuffer' });

  const safeName =
    (project.name || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9\-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project';

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeName}-${project.id}.zip"`,
      'Content-Length': String(content.length),
    },
  });
}

