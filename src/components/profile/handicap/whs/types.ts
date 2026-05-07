export type HandicapSubtab = 'today' | 'trends' | 'friends';

export const HANDICAP_SUBTABS: HandicapSubtab[] = ['today', 'trends', 'friends'];

export const isHandicapSubtab = (v: unknown): v is HandicapSubtab =>
  typeof v === 'string' && (HANDICAP_SUBTABS as readonly string[]).includes(v);
