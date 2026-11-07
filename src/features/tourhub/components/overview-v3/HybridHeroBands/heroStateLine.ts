/** The ONE tour-line state wording, shared by the overview PhotoBand and the
 * tournament page hero so both read "PGA TOUR · ROUND 3" identically. CSS
 * uppercases the line; the upcoming day arrives already capitalised. */
import type { TFunction } from 'i18next';

export interface HeroStateLineInput {
  kind: 'live' | 'suspended' | 'results' | 'upcoming';
  round?: number;
  totalRounds?: number | null;
  /** Results variant: a decided playoff, never FINAL. */
  playoff?: boolean;
  startDay?: string | null;
}

export function heroStateLine(t: TFunction, state: HeroStateLineInput): string {
  if (state.kind === 'live') {
    return state.round != null && state.totalRounds != null && state.round === state.totalRounds
      ? t('overview.hero.finalRound')
      : t('overview.hero.round', { round: state.round });
  }
  if (state.kind === 'suspended') {
    return `${t('overview.hero.round', { round: state.round })} · ${t('overview.hero.stateSuspended')}`;
  }
  if (state.kind === 'results' && state.playoff) {
    return t('overview.hero.statePlayoff', { defaultValue: 'PLAYOFF' });
  }
  if (state.kind === 'upcoming' && state.startDay) {
    return t('overview.hero.starts', { day: state.startDay });
  }
  return t('overview.alsoThisWeek.final');
}
