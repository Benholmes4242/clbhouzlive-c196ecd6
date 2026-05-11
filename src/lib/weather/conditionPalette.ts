/**
 * conditionPalette — pure mapping from WeatherData → visual ConditionState,
 * gradient warping by time-of-day, temporal cell mode, trend, and copy
 * helpers. No React, no DOM — testable in isolation.
 */
import type { WeatherData } from './types';

export type WeatherPattern = 'none' | 'rain' | 'wind';
export type TemporalMode = 'sunset' | 'light_left' | 'sunrise_tomorrow';
export type TempTrend = 'rising' | 'falling' | 'steady';

export interface ConditionState {
  /** Top of the sky gradient — lighter end (alias: skyTopBase). */
  skyTop: string;
  /** Bottom of the sky gradient (alias: skyBottomBase). */
  skyBottom: string;
  textOnBg: string;
  textMutedOnBg: string;
  hairlineOnBg: string;
  accent: string;
  pattern: WeatherPattern;
  /** Which lucide icon to render in the icon tile. */
  iconType: 'sun' | 'cloud' | 'drizzle' | 'rain' | 'snow' | 'storm' | 'fog' | 'wind' | 'moon';
}

const SUNNY: ConditionState = {
  skyTop: '#FEF3C7', skyBottom: '#FBBF24',
  textOnBg: '#1F2937', textMutedOnBg: 'rgba(31,41,55,0.70)',
  hairlineOnBg: 'rgba(31,41,55,0.18)', accent: '#F59E0B',
  pattern: 'none',
  iconType: 'sun',
};

const COOL_MORNING: ConditionState = {
  skyTop: '#E0F2FE', skyBottom: '#FDE68A',
  textOnBg: '#0F172A', textMutedOnBg: 'rgba(15,23,42,0.65)',
  hairlineOnBg: 'rgba(15,23,42,0.15)', accent: '#F97316',
  pattern: 'none',
  iconType: 'sun',
};

const CLOUDY: ConditionState = {
  skyTop: '#E2E8F0', skyBottom: '#94A3B8',
  textOnBg: '#0F172A', textMutedOnBg: 'rgba(15,23,42,0.60)',
  hairlineOnBg: 'rgba(15,23,42,0.18)', accent: '#64748B',
  pattern: 'none',
  iconType: 'cloud',
};

const RAINY: ConditionState = {
  skyTop: '#475569', skyBottom: '#1E293B',
  textOnBg: '#F8FAFC', textMutedOnBg: 'rgba(248,250,252,0.78)',
  hairlineOnBg: 'rgba(248,250,252,0.18)', accent: '#38BDF8',
  pattern: 'rain',
  iconType: 'rain',
};

const WINDY: ConditionState = {
  skyTop: '#FDE68A', skyBottom: '#F97316',
  textOnBg: '#1F2937', textMutedOnBg: 'rgba(31,41,55,0.65)',
  hairlineOnBg: 'rgba(31,41,55,0.18)', accent: '#C2410C',
  pattern: 'wind',
  iconType: 'wind',
};

const STORM: ConditionState = {
  skyTop: '#1F2937', skyBottom: '#030712',
  textOnBg: '#F8FAFC', textMutedOnBg: 'rgba(248,250,252,0.65)',
  hairlineOnBg: 'rgba(248,250,252,0.18)', accent: '#A78BFA',
  pattern: 'none',
  iconType: 'storm',
};

const NIGHT: ConditionState = {
  skyTop: '#1E293B', skyBottom: '#0F172A',
  textOnBg: '#F8FAFC', textMutedOnBg: 'rgba(248,250,252,0.65)',
  hairlineOnBg: 'rgba(248,250,252,0.18)', accent: '#60A5FA',
  pattern: 'none',
  iconType: 'moon',
};

/** Priority-ordered picker. */
export function pickConditionState(w: WeatherData): ConditionState {
  if (w.weatherCode >= 95 && w.weatherCode <= 99) return STORM;
  if (
    (w.weatherCode >= 51 && w.weatherCode <= 57) ||
    (w.weatherCode >= 61 && w.weatherCode <= 67) ||
    (w.weatherCode >= 80 && w.weatherCode <= 82)
  ) return RAINY;
  if (w.windGust >= 25) return WINDY;
  if (w.isDay === 0) return NIGHT;
  if ([2, 3, 45, 48].includes(w.weatherCode)) return CLOUDY;
  if ((w.weatherCode === 0 || w.weatherCode === 1) && w.temperature < 10) return COOL_MORNING;
  return SUNNY;
}

// ── Time-of-day gradient warping ──────────────────────────────────

export interface WarpedGradient {
  topBase: string;
  bottomBase: string;
  /** Pink dawn overlay (top → transparent). NULL outside dawn window. */
  dawnOverlayColor: string | null;
  /** Warm sunset overlay (bottom → transparent). NULL outside sunset window. */
  sunsetOverlayColor: string | null;
}

export function warpGradient(state: ConditionState, dayProgress: number): WarpedGradient {
  const out: WarpedGradient = {
    topBase: state.skyTop,
    bottomBase: state.skyBottom,
    dawnOverlayColor: null,
    sunsetOverlayColor: null,
  };
  if (dayProgress < 0) return out;

  if (dayProgress < 0.25) {
    const intensity = (0.25 - dayProgress) / 0.25;
    out.dawnOverlayColor = `rgba(252, 165, 165, ${(intensity * 0.45).toFixed(3)})`;
  }
  if (dayProgress > 0.75) {
    const intensity = (dayProgress - 0.75) / 0.25;
    out.sunsetOverlayColor = `rgba(251, 113, 36, ${(intensity * 0.5).toFixed(3)})`;
  }
  return out;
}

export function buildBackgroundCss(g: WarpedGradient): string {
  const baseGradient = `linear-gradient(180deg, ${g.topBase} 0%, ${g.bottomBase} 100%)`;
  const stack: string[] = [];
  if (g.dawnOverlayColor) {
    stack.push(`linear-gradient(180deg, ${g.dawnOverlayColor} 0%, transparent 50%)`);
  }
  if (g.sunsetOverlayColor) {
    stack.push(`linear-gradient(0deg, ${g.sunsetOverlayColor} 0%, transparent 50%)`);
  }
  stack.push(baseGradient);
  return stack.join(', ');
}

// ── Temporal cell mode ────────────────────────────────────────────

export interface TemporalCellData {
  mode: TemporalMode;
  value: string;
  sub: string;
  iconType: 'sunset' | 'sunrise';
}

export function pickTemporalMode(w: WeatherData): TemporalCellData {
  if (w.isDay === 0) {
    return {
      mode: 'sunrise_tomorrow',
      value: w.sunriseTomorrowTime,
      sub: 'sunrise tmrw',
      iconType: 'sunrise',
    };
  }
  if (w.daylightHoursRemaining !== null && w.daylightHoursRemaining <= 3) {
    const hrs = Math.floor(w.daylightHoursRemaining);
    const mins = Math.round((w.daylightHoursRemaining - hrs) * 60);
    const label = hrs >= 1 ? `${hrs}h ${mins}m` : `${mins}m`;
    return { mode: 'light_left', value: label, sub: 'light left', iconType: 'sunset' };
  }
  return { mode: 'sunset', value: w.sunsetTime, sub: 'sunset', iconType: 'sunset' };
}

// ── Trend ─────────────────────────────────────────────────────────

export function pickTemperatureTrend(w: WeatherData): TempTrend {
  const delta = w.nextHourTemp - w.temperature;
  if (delta >= 2) return 'rising';
  if (delta <= -2) return 'falling';
  return 'steady';
}

// ── "Updated X" ───────────────────────────────────────────────────

export function formatUpdatedAt(fetchedAt: number, nowMs: number = Date.now()): string {
  const minsAgo = Math.floor((nowMs - fetchedAt) / 60000);
  if (minsAgo < 1) return 'just now';
  if (minsAgo === 1) return '1 min ago';
  if (minsAgo < 60) return `${minsAgo} min ago`;
  const hrsAgo = Math.floor(minsAgo / 60);
  if (hrsAgo === 1) return '1 hr ago';
  return `${hrsAgo} hr ago`;
}

// ── Trajectory copy ───────────────────────────────────────────────

export function shouldShowTrajectory(w: WeatherData): boolean {
  return w.peakTempToday >= w.temperature + 3 && w.peakTempTimeLabel !== '';
}
