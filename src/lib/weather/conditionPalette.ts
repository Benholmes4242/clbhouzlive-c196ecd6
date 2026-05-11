/**
 * conditionPalette — pure mapping from WeatherData → visual ConditionState.
 *
 * Lives independently of React so the rules can be unit-tested and tweaked
 * without touching the card component.
 */
import type { WeatherData } from './types';

export type WeatherPattern = 'none' | 'rain' | 'wind';

export interface ConditionState {
  /** Top of the sky gradient — lighter end. */
  skyTop: string;
  /** Bottom of the sky gradient — darker end. */
  skyBottom: string;
  /** Primary text colour over the backdrop. */
  textOnBg: string;
  /** Secondary muted text colour. */
  textMutedOnBg: string;
  /** Hairline divider colour on this backdrop. */
  hairlineOnBg: string;
  /** Accent colour for pattern overlay strokes. */
  accent: string;
  /** Which pattern (if any) overlays the gradient. */
  pattern: WeatherPattern;
}

const SUNNY: ConditionState = {
  skyTop: '#FEF3C7',
  skyBottom: '#FBBF24',
  textOnBg: '#1F2937',
  textMutedOnBg: 'rgba(31,41,55,0.70)',
  hairlineOnBg: 'rgba(31,41,55,0.18)',
  accent: '#F59E0B',
  pattern: 'none',
};

const COOL_MORNING: ConditionState = {
  skyTop: '#E0F2FE',
  skyBottom: '#FDE68A',
  textOnBg: '#0F172A',
  textMutedOnBg: 'rgba(15,23,42,0.65)',
  hairlineOnBg: 'rgba(15,23,42,0.15)',
  accent: '#F97316',
  pattern: 'none',
};

const CLOUDY: ConditionState = {
  skyTop: '#E2E8F0',
  skyBottom: '#94A3B8',
  textOnBg: '#0F172A',
  textMutedOnBg: 'rgba(15,23,42,0.60)',
  hairlineOnBg: 'rgba(15,23,42,0.18)',
  accent: '#64748B',
  pattern: 'none',
};

const RAINY: ConditionState = {
  skyTop: '#475569',
  skyBottom: '#1E293B',
  textOnBg: '#F8FAFC',
  textMutedOnBg: 'rgba(248,250,252,0.70)',
  hairlineOnBg: 'rgba(248,250,252,0.18)',
  accent: '#38BDF8',
  pattern: 'rain',
};

const WINDY: ConditionState = {
  skyTop: '#FDE68A',
  skyBottom: '#F97316',
  textOnBg: '#1F2937',
  textMutedOnBg: 'rgba(31,41,55,0.65)',
  hairlineOnBg: 'rgba(31,41,55,0.18)',
  accent: '#C2410C',
  pattern: 'wind',
};

const STORM: ConditionState = {
  skyTop: '#1F2937',
  skyBottom: '#030712',
  textOnBg: '#F8FAFC',
  textMutedOnBg: 'rgba(248,250,252,0.65)',
  hairlineOnBg: 'rgba(248,250,252,0.18)',
  accent: '#A78BFA',
  pattern: 'none',
};

const NIGHT: ConditionState = {
  skyTop: '#1E293B',
  skyBottom: '#0F172A',
  textOnBg: '#F8FAFC',
  textMutedOnBg: 'rgba(248,250,252,0.65)',
  hairlineOnBg: 'rgba(248,250,252,0.18)',
  accent: '#60A5FA',
  pattern: 'none',
};

/**
 * Decide which visual state a weather payload renders as.
 * Priority order matters — earlier conditions win.
 */
export function pickConditionState(w: WeatherData): ConditionState {
  // 1. STORM — thunderstorm WMO codes 95, 96, 99
  if (w.weatherCode >= 95 && w.weatherCode <= 99) return STORM;

  // 2. RAIN — drizzle, rain, showers, freezing rain
  if (
    (w.weatherCode >= 51 && w.weatherCode <= 57) ||
    (w.weatherCode >= 61 && w.weatherCode <= 67) ||
    (w.weatherCode >= 80 && w.weatherCode <= 82)
  ) {
    return RAINY;
  }

  // 3. WINDY — gusts ≥25mph trump cloudy/sunny states
  if (w.windGust >= 25) return WINDY;

  // 4. NIGHT — if isDay=0 and we haven't already returned
  if (w.isDay === 0) return NIGHT;

  // 5. CLOUDY — overcast (3), partly cloudy (2), fog (45/48)
  if (w.weatherCode === 2 || w.weatherCode === 3 || w.weatherCode === 45 || w.weatherCode === 48) {
    return CLOUDY;
  }

  // 6. COOL MORNING — clear (0, 1) with current temp < 10°C
  if ((w.weatherCode === 0 || w.weatherCode === 1) && w.temperature < 10) {
    return COOL_MORNING;
  }

  // 7. SUNNY — default for clear skies
  return SUNNY;
}
