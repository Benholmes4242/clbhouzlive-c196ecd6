export type HandicapSubtab = 'today' | 'form' | 'circle';

export const HANDICAP_SUBTABS: HandicapSubtab[] = ['today', 'form', 'circle'];

export const isHandicapSubtab = (v: unknown): v is HandicapSubtab =>
  typeof v === 'string' && (HANDICAP_SUBTABS as readonly string[]).includes(v);

/**
 * Legacy `?subtab=` values from the five-tab era. Applied BEFORE
 * `isHandicapSubtab` so old deep links land on the correct new tab
 * instead of silently falling back to Today.
 */
export const LEGACY_SUBTAB_ALIAS: Record<string, HandicapSubtab> = {
  overview: 'today',
  trends: 'form',
  records: 'form',
  friends: 'circle',
  legends: 'circle',
};

/**
 * Resolve a raw `?subtab=` param to a live subtab.
 * `migrated` is true when a legacy alias was translated, which callers use
 * to REPLACE the URL so the address bar shows the new value.
 */
export function resolveHandicapSubtab(raw: string | null | undefined): {
  subtab: HandicapSubtab;
  migrated: boolean;
} {
  if (raw && Object.prototype.hasOwnProperty.call(LEGACY_SUBTAB_ALIAS, raw)) {
    return { subtab: LEGACY_SUBTAB_ALIAS[raw], migrated: true };
  }
  if (isHandicapSubtab(raw)) return { subtab: raw, migrated: false };
  return { subtab: 'today', migrated: false };
}
