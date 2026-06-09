export type RivalryState = 'winning' | 'losing' | 'neutral';

export interface RivalryStateToken {
  cardSweep: string;
  cardBorder: string;
  outerGlow: string | null;
  selfNumColor: string;
  rivalNumColor: string;
  pillWinGradient: string;
  pillLossBg: string;
  pillTieBg: string;
  pillEmptyBg: string;
  edgeColor: string;
  streakColor: string;
  tierBadgeColor: string;
  tierBadgeBorder: string;
}

const AMBER = '#F7931E';
const GOLD = '#FBBC2E';
const RED = 'var(--hcp-bad)';

const PILL_WIN = `linear-gradient(180deg, ${GOLD} 0%, ${AMBER} 100%)`;
const PILL_LOSS = 'rgba(159,29,29,0.85)';
const PILL_TIE = 'rgba(148,163,184,0.20)';
const PILL_EMPTY = 'rgba(255,255,255,0.05)';

export const RIVALRY_STATE_TOKENS: Record<RivalryState, RivalryStateToken> = {
  winning: {
    cardSweep: `linear-gradient(180deg, #1A1300 0%, var(--hcp-bg-1) 75%, var(--hcp-bg-1) 100%)`,
    cardBorder: 'rgba(247,147,30,0.40)',
    outerGlow: '0 8px 28px -8px rgba(247,147,30,0.20)',
    selfNumColor: GOLD,
    rivalNumColor: 'rgba(255,255,255,0.40)',
    pillWinGradient: PILL_WIN,
    pillLossBg: PILL_LOSS,
    pillTieBg: PILL_TIE,
    pillEmptyBg: PILL_EMPTY,
    edgeColor: GOLD,
    streakColor: GOLD,
    tierBadgeColor: GOLD,
    tierBadgeBorder: 'rgba(247,147,30,0.50)',
  },
  losing: {
    cardSweep: `linear-gradient(180deg, #1A0000 0%, var(--hcp-bg-1) 75%, var(--hcp-bg-1) 100%)`,
    cardBorder: 'rgba(159,29,29,0.40)',
    outerGlow: '0 8px 28px -8px rgba(159,29,29,0.30)',
    selfNumColor: 'rgba(255,255,255,0.40)',
    rivalNumColor: GOLD,
    pillWinGradient: PILL_WIN,
    pillLossBg: PILL_LOSS,
    pillTieBg: PILL_TIE,
    pillEmptyBg: PILL_EMPTY,
    edgeColor: RED,
    streakColor: RED,
    tierBadgeColor: GOLD,
    tierBadgeBorder: 'rgba(247,147,30,0.50)',
  },
  neutral: {
    cardSweep: `linear-gradient(180deg, var(--hcp-bg-2) 0%, var(--hcp-bg-1) 75%, var(--hcp-bg-1) 100%)`,
    cardBorder: 'rgba(148,163,184,0.22)',
    outerGlow: null,
    selfNumColor: 'rgba(255,255,255,0.85)',
    rivalNumColor: 'rgba(255,255,255,0.85)',
    pillWinGradient: PILL_WIN,
    pillLossBg: PILL_LOSS,
    pillTieBg: PILL_TIE,
    pillEmptyBg: PILL_EMPTY,
    edgeColor: 'var(--hcp-t-60)',
    streakColor: 'var(--hcp-t-60)',
    tierBadgeColor: 'var(--hcp-t-80)',
    tierBadgeBorder: 'rgba(255,255,255,0.20)',
  },
};

export function rivalryStateFor(
  selfWins: number,
  rivalWins: number,
  sharedRounds: number,
): RivalryState {
  if (sharedRounds === 0) return 'neutral';
  if (selfWins > rivalWins) return 'winning';
  if (rivalWins > selfWins) return 'losing';
  return 'neutral';
}
