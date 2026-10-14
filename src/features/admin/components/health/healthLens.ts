/** Health URL state (BRIEF_HEALTH routing). */
export type HealthLens = 'status' | 'golf' | 'app' | 'jobs';
export type HealthView = { kind: 'lens'; lens: HealthLens } | { kind: 'settings' } | { kind: 'video' };

export const HEALTH_LENSES: { id: HealthLens; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'golf', label: 'Golf data' },
  { id: 'app', label: 'App' },
  { id: 'jobs', label: 'Jobs' },
];

const IDS = HEALTH_LENSES.map((l) => l.id) as string[];
const LEGACY: Record<string, HealthLens> = { status: 'status', stability: 'app', audit: 'jobs', tools: 'golf' };

export const lensLabel = (l: HealthLens) => HEALTH_LENSES.find((x) => x.id === l)!.label;

/** Legacy ?tab= value -> lens, or null when the tab keeps its own page / is unknown. */
export const legacyHealthLens = (tab: string | null): HealthLens | null => (tab && LEGACY[tab]) || null;

export function healthViewOf(params: URLSearchParams, canManage: boolean): HealthView {
  if (!canManage) return { kind: 'settings' };
  const tab = params.get('tab');
  if (tab === 'settings') return { kind: 'settings' };
  if (tab === 'video') return { kind: 'video' };
  const l = params.get('lens');
  if (l && IDS.includes(l)) return { kind: 'lens', lens: l as HealthLens };
  return { kind: 'lens', lens: legacyHealthLens(tab) ?? 'status' };
}

/** The params to write with replace, or null when the URL is already canonical. */
export function canonicalHealthParams(params: URLSearchParams, view: HealthView): URLSearchParams | null {
  if (view.kind !== 'lens') return null;
  if (!params.has('tab') && params.get('lens') === view.lens) return null;
  if (!params.has('tab') && !params.has('lens')) return null;
  const next = new URLSearchParams(params);
  next.delete('tab');
  next.set('lens', view.lens);
  return next;
}
