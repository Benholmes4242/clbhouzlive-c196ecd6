import { AMBER, WHITE_ALPHA_65, STATUS_LIVE_ON_DARK, TOPAR_UNDER_DARK } from '../../../_shared/tokens';
/** CB58 scoped mock anatomy. Tour-green ruling overrides the mock's dot. */
export const LEADERS_GROUP = {
  ink: '#FFFFFF', mute: WHITE_ALPHA_65, amber: AMBER, under: TOPAR_UNDER_DARK,
  live: STATUS_LIVE_ON_DARK, halo: '0 0 0 3px rgba(94,233,166,0.18)',
  grid: '34px minmax(0,1fr) 44px 50px 44px',
} as const;