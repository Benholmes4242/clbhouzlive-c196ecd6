import type { TFunction } from 'i18next';
import { heroStateLine, type HeroStateLineInput } from './heroStateLine';

/** Below 340px the overview kicker uses these short forms (FINAL ROUND, upcoming
 * and finished wording are unchanged), so no tour kicker ellipsises at 320. */
export function heroStateLineShort(t: TFunction, state: HeroStateLineInput): string {
  if (state.kind === 'live' && state.delayedRound != null) return t('overview.hero.roundDelayedShort', { round: state.delayedRound });
  if (state.kind === 'live' && state.afterRound != null) return t('overview.hero.afterRoundShort', { round: state.afterRound });
  if (state.kind === 'live' && !(state.round != null && state.totalRounds != null && state.round === state.totalRounds)) return t('overview.hero.roundShort', { round: state.round });
  if (state.kind === 'suspended') return t('overview.hero.suspendedShort', { round: state.round });
  return heroStateLine(t, state);
}
