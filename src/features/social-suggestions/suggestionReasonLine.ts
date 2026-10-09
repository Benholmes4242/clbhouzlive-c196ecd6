/**
 * THE SUGGESTION REASON LINE — the one sentence under a suggested member's
 * name. Shared by the search overlay and the Find golfers sheet so the two
 * surfaces cannot drift. Ranking stays server-side; this is copy only.
 */
export interface SuggestionReasonInput {
  reason_type: string;
  reason_detail: string | null;
  home_club: string | null;
  rounds_tracked: number | null;
}

type T = (key: string, opts?: Record<string, unknown>) => string;

export function suggestionReasonLine(s: SuggestionReasonInput, t: T): string {
  const detail = s.reason_detail?.trim() || null;
  if (s.reason_type === 'followed_by' && detail)
    return t('suggestionReason.followedBy', { ns: 'common', detail });
  if (s.reason_type === 'plays' && detail)
    return t('suggestionReason.plays', { ns: 'common', detail });
  const club = s.home_club?.trim() || null;
  const n = s.rounds_tracked && s.rounds_tracked > 0 ? s.rounds_tracked : 0;
  if (club && n) return t('suggestionReason.clubRounds', { ns: 'common', club, count: n });
  if (n) return t('suggestionReason.roundsTracked', { ns: 'common', count: n });
  if (club) return club;
  return t('suggestionReason.popular', { ns: 'common' });
}
