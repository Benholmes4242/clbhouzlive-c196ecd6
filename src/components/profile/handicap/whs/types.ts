export type HandicapSubtab = 'overview' | 'trends' | 'friends';

export const HANDICAP_SUBTABS: HandicapSubtab[] = ['overview', 'trends', 'friends'];

export const isHandicapSubtab = (v: unknown): v is HandicapSubtab =>
  typeof v === 'string' && (HANDICAP_SUBTABS as readonly string[]).includes(v);
