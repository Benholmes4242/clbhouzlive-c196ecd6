/**
 * The connect intro's single scoring band: the whole course's actual mix in
 * RAMP_TOPAR, the same four buckets and colours the chart above uses per hole,
 * so the band is the chart's key. One palette, used twice.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BucketShares } from '@/features/courses/components/holes/analytical/HoleRowV2';
import { ABOUT_KICKER } from '@/components/courses/course-detail/about/AboutSection';
import { A, BAR_RADIUS, RAMP_TOPAR } from '@/features/courses/components/holes/analytical/tokens';
import { NUM } from './designTokens';
import { formatNumber } from '@/i18n/format';

const ORDER = ['birdie', 'par', 'bogey', 'double'] as const;

const FILLS: Record<(typeof ORDER)[number], string> = {
  birdie: RAMP_TOPAR.birdie,
  par: RAMP_TOPAR.par,
  bogey: RAMP_TOPAR.bogey,
  double: RAMP_TOPAR.double,
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

export const ScoringBand: React.FC<{ shares: BucketShares; holesTracked: number }> = ({ shares, holesTracked }) => {
  const { t } = useTranslation('handicap');
  const pcts = wholePercents(ORDER.map((k) => shares[k]));
  return (
    <div style={{ marginTop: 26 }}>
      {/* Degenerate guard: no "0 holes" label, even though null shares should already prevent it. */}
      {Number.isFinite(holesTracked) && holesTracked > 0 ? (
        <div style={{ ...ABOUT_KICKER, marginBottom: 11 }}>
          {t('whsConnect.intro.scoresVolume', { count: holesTracked, holes: formatNumber(holesTracked) })}
        </div>
      ) : null}
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
