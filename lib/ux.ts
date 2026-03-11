import type { Project, ValidationItem, ValidationReport } from './types';

export type Milestones = {
  fixityReady: boolean;
  interpretabilityReady: boolean;
  timelineConsistent: boolean;
  stampLabel: 'READY' | 'EXPORT WITH WARNINGS' | 'NEEDS WORK';
};

export type NextFix = ValidationItem & {
  priority: number;
};

export const UX_CONSTANTS = {
  animation: {
    sweepMs: 180,
    pulseMs: 600,
    stampMs: 220,
  },
} as const;

export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function computeMilestones(
  validation: ValidationReport | undefined,
  project: Project | null,
): Milestones {
  if (!validation || !project) {
    return {
      fixityReady: false,
      interpretabilityReady: false,
      timelineConsistent: false,
      stampLabel: 'NEEDS WORK',
    };
  }

  const codes = new Set(validation.items.map((i) => i.code));

  const fixityReady = !codes.has('REF_MEDIA_MISSING');

  const maxCueEnd = project.timeline.segments.reduce(
    (max, c) => Math.max(max, c.end),
    0,
  );
  const interpretabilityReady =
    typeof project.meta.durationSec === 'number'
      ? project.meta.durationSec >= maxCueEnd
      : true;

  const timelineConsistent = !codes.has('CUE_TIME_INVALID');

  let stampLabel: Milestones['stampLabel'] = 'NEEDS WORK';
  if (validation.summary.errors === 0) {
    stampLabel =
      validation.summary.warnings === 0 && validation.summary.info === 0
        ? 'READY'
        : 'EXPORT WITH WARNINGS';
  }

  return {
    fixityReady,
    interpretabilityReady,
    timelineConsistent,
    stampLabel,
  };
}

export function getNextFixes(
  validation: ValidationReport | undefined,
): NextFix[] {
  if (!validation) return [];

  const score = (item: ValidationItem): number => {
    let s = 0;
    if (item.severity === 'error') s += 100;
    if (item.severity === 'warning') s += 50;

    if (item.code === 'REF_MEDIA_MISSING') s += 40;
    if (item.code === 'CUE_TIME_INVALID') s += 30;
    if (item.code.startsWith('DMX_') || item.code === 'DMX_RANGE_OVERFLOW') s += 25;
    if (item.code === 'CUE_NAME_DUPLICATE' || item.code === 'CUE_NAME_EMPTY') s += 28;

    return s;
  };

  return validation.items
    .map((i) => ({ ...i, priority: score(i) }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

export function withAnimation<T extends (...args: any[]) => void>(
  fn: T,
): T {
  return (((...args: any[]) => {
    if (isReducedMotion()) {
      fn(...args);
      return;
    }
    fn(...args);
  }) as unknown) as T;
}

