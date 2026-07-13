export interface ScorecardTheme {
  bg: string; bg2: string; line: string;
  ink: string; dim: string; faint: string; ghost: string;
  cellBg: string; cellLine: string;
  accent: string;   // date eyebrow
  under: string;    // under-par accents (round hero, diff)
  over: string;     // over-par accents
}

export const SCORECARD_LIGHT: ScorecardTheme = {
  bg: '#FFFFFF', bg2: '#F8FAFC', line: '#EEF1F4',
  ink: '#0F172A', dim: '#64748B', faint: '#94A3B8', ghost: '#CBD5E1',
  cellBg: '#F8FAFC', cellLine: '#E2E8F0',
  accent: '#c97a10',
  under: '#D2222D', over: '#1D5DBF',
};

export const SCORECARD_DARK: ScorecardTheme = {
  bg: '#1B1E27',   // --hcp-bg-1: sheet sits raised over the #15171F page
  bg2: '#20242E',  // --hcp-bg-2: seam strip / cells
  line: 'rgba(255,255,255,0.08)',
  ink: '#F2F4F7', dim: 'rgba(242,244,247,0.55)',
  faint: 'rgba(242,244,247,0.38)', ghost: 'rgba(242,244,247,0.20)',
  cellBg: 'rgba(255,255,255,0.04)', cellLine: 'rgba(255,255,255,0.10)',
  accent: '#F7931E',
  under: '#FF6B5E', over: '#7AA6EC',
};
