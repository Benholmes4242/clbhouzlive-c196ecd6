/**
 * Analytics URL state. Read by AnalyticsPage AND AdminShell's header, so the
 * lens is derived from the query string in one place (no header store).
 */
export type Lens = 'health' | 'behaviour' | 'journeys' | 'screens' | 'live';
export type Diagnostic = 'events' | 'auth';
export type Range = '7d' | '30d' | '90d';

export const LENSES: { id: Exclude<Lens, 'live'>; label: string }[] = [
  { id: 'health', label: 'Health' },
  { id: 'behaviour', label: 'Behaviour' },
  { id: 'journeys', label: 'Journeys' },
  { id: 'screens', label: 'Screens' },
];

const ALL: Lens[] = ['health', 'behaviour', 'journeys', 'screens', 'live'];
export const isLens = (v: string | null): v is Lens => !!v && (ALL as string[]).includes(v);

/** Legacy ?tab= / ?view= values and the lens they now land on. */
export function legacyLens(tab: string | null, view: string | null): Lens | null {
  if (tab) {
    if (tab === 'funnels') return 'journeys';
    if (tab === 'screens') return 'screens';
    if (tab === 'live') return 'live';
    if (['overview', 'growth', 'engagement', 'retention'].includes(tab)) return 'health';
  }
  if (view) return 'health';
  return null;
}

export function diagnosticOf(params: URLSearchParams): Diagnostic | null {
  const tab = params.get('tab');
  return tab === 'events' || tab === 'auth' ? tab : null;
}

export function lensOf(params: URLSearchParams): Lens {
  const l = params.get('lens');
  if (isLens(l)) return l;
  return legacyLens(params.get('tab'), params.get('view')) ?? 'health';
}

export function rangeOf(params: URLSearchParams): Range {
  const r = params.get('range');
  return r === '7d' || r === '90d' ? r : '30d';
}

export const rangeDays = (r: Range): 7 | 30 | 90 => (r === '7d' ? 7 : r === '90d' ? 90 : 30);

/** Open Live, remembering where Back returns to. Keeps range. */
export function toLive(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  const from = lensOf(params);
  next.delete('tab'); next.delete('view');
  next.set('lens', 'live');
  if (from !== 'live') next.set('from', from);
  return next;
}

export function backFromLive(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  const from = params.get('from');
  next.set('lens', isLens(from) && from !== 'live' ? from : 'health');
  next.delete('from'); next.delete('staff');
  return next;
}
