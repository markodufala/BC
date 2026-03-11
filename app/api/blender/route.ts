import { NextResponse } from 'next/server';
import { generatePerformanceJSON } from '@/lib/validation';
import type { Project } from '@/lib/types';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Adjust these paths to match your local setup.
const EXPORT_DIR = '/Users/marko/PerformanceSyncExports';
const BOOTSTRAP_SCRIPT = path.join(
  process.cwd(),
  'scripts',
  'psync_blender_bootstrap.py',
);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { project: Project };
    if (!body?.project) {
      return NextResponse.json(
        { error: 'Missing project in request body' },
        { status: 400 },
      );
    }

    const project = body.project;
    const perfJson = generatePerformanceJSON(project);

    await fs.mkdir(EXPORT_DIR, { recursive: true });

    const safeName =
      (project.name || 'project')
        .toLowerCase()
        .replace(/[^a-z0-9\-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'project';

    const jsonFileName = `${safeName}-${project.id}.performance.json`;
    const jsonPath = path.join(EXPORT_DIR, jsonFileName);

    await fs.writeFile(jsonPath, JSON.stringify(perfJson, null, 2), 'utf-8');

    // Launch Blender on macOS with the bootstrap script and JSON path.
    const child = spawn(
      'open',
      ['-a', 'Blender', '--args', '-P', BOOTSTRAP_SCRIPT, '--', jsonPath],
      {
        detached: true,
        stdio: 'ignore',
      },
    );

    child.unref();

    return NextResponse.json({
      ok: true,
      jsonPath,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error launching Blender', err);
    return NextResponse.json(
      { error: 'Failed to launch Blender' },
      { status: 500 },
    );
  }
}

