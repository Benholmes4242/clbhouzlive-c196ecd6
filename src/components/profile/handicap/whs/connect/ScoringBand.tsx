/**
 * The connect intro's single scoring band. White at four opacities, brightest
 * for the best score, so the band reads good-to-bad without a hue. Do NOT use
 * RAMP_TOPAR here: its hues collided with the chart and were removed.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BucketShares } from '@/features/courses/components/holes/analytical/HoleRowV2';
import { ABOUT_KICKER } from '@/components/courses/course-detail/about/AboutSection';
import { A, BAR_RADIUS } from '@/features/courses/components/holes/analytical/tokens';
import { NUM } from './designTokens';

const ORDER = ['birdie', 'par', 'bogey', 'double'] as const;

const FILLS: Record<(typeof ORDER)[number], string> = {
  birdie: 'rgba(248,250,252,0.86)',
  par: 'rgba(248,250,252,0.58)',
  bogey: 'rgba(248,250,252,0.34)',
  double: 'rgba(248,250,252,0.18)',
};

const LABEL_KEYS = {
  birdie: 'whsConnect.intro.bucketBirdie',
  par: 'whsConnect.intro.bucketPar',
  bogey: 'whsConnect.intro.bucketBogey',
  double: 'whsConnect.intro.bucketDouble',
} as const;

/** Largest-remainder rounding: whole percentages that always sum to 100. */
export function wholePercents(shares: number[]): number[] {
  const total = shares.reduce((s, v) => s + v, 0);
  if (total <= 0) return shares.map(() => 0);
  const exact = shares.map((v) => (v / total) * 100);
  const out = exact.map(Math.floor);
  let left = 100 - out.reduce((s, v) => s + v, 0);
  const byRemainder = exact.map((v, i) => ({ i, r: v - Math.floor(v) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (let k = 0; left > 0; k = (k + 1) % byRemainder.length, left--) out[byRemainder[k].i] += 1;
  return out;
}

export const ScoringBand: React.FC<{ shares: BucketShares }> = ({ shares }) => {
  const { t } = useTranslation('handicap');
  const pcts = wholePercents(ORDER.map((k) => shares[k]));
  return (
    <div style={{ marginTop: 26 }}>
      <div style={{ ...ABOUT_KICKER, marginBottom: 11 }}>{t('whsConnect.intro.scoresLabel')}</div>
      <div aria-hidden="true" style={{ display: 'flex', gap: 2, height: 10 }}>
        {ORDER.map((k) => (
          <span key={k} style={{ flex: shares[k], borderRadius: BAR_RADIUS, background: FILLS[k] }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 13 }}>
        {ORDER.map((k, i) => (
          <div key={k} style={{ minWidth: 0, textAlign: i === ORDER.length - 1 ? 'right' : 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK, ...NUM }}>{pcts[i]}%</div>
            <div style={{ ...ABOUT_KICKER, marginTop: 4 }}>{t(LABEL_KEYS[k])}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoringBand;
