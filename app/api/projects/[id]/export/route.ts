import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import type { Project } from '@/lib/types';

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

  const project = (data as any).data as Project;

  const zip = new JSZip();
  zip.file('project.json', JSON.stringify(project, null, 2));
  zip.file('metadata.json', JSON.stringify(project.meta ?? {}, null, 2));
  zip.file('assets.json', JSON.stringify(project.assets ?? [], null, 2));
  zip.file('media.json', JSON.stringify(project.media ?? [], null, 2));
  zip.file('timeline.json', JSON.stringify(project.timeline ?? {}, null, 2));
  zip.file('snapshots.json', JSON.stringify(project.snapshots ?? [], null, 2));
  zip.file('devices.json', JSON.stringify(project.devices ?? { devices: [] }, null, 2));

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

