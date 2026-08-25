/**
 * TYPE — THE HERO EXCEPTION (BRIEF_TOUR_OVERVIEW_TYPE_SCALE, Part 2).
 * The hero is a broadcast surface. Tracked-out caps over photography read
 * larger than their point size, so a ticker segment, a band label or a rank
 * marker takes the AXIS floor of 10 rather than the READ floor of 11 — the
 * same exception granted to the scorecard axis and the chart ticks. It covers
 * COORDINATES AND MARKERS ONLY. It does NOT cover leader names, tournament
 * names, course names, scores, or any sentence: those are language and take
 * 11. Nothing goes below 10.
 */
/**
 * FieldStrengthStrip — Upcoming · far middle band fallback (level 2).
 * Shown when no defending champion data exists but field info does.
 * Per TOUR_HUB_POLISH_PATCH_BRIEF §4.3.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { INK, GOLD, NUMERIC_STYLE, STRIP_HEIGHT } from '../HybridHero.constants';

import { SLATE_800, WHITE_ALPHA_55 } from '../../../_shared/tokens';

export interface FieldStrengthStripProps {
  totalPlayers: number;
  topRanked?: number | null;
  topRankedThreshold?: number;
  headshots?: string[];
}

function StackedHeads({ photos }: { photos: string[] }) {
  const visible = photos.slice(0, 3);
  // Dark cinematic backdrop → 1px white hairline traced ON the squircle.
  const HAIRLINE = 'inset 0 0 0 1px rgba(255,255,255,0.22)';
  if (visible.length === 0) {
    return (
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: '34%',
          background: `linear-gradient(135deg, #475569 0%, ${SLATE_800} 100%)`,
          boxShadow: `${HAIRLINE}, 0 0 0 2px rgba(251,188,46,0.55)`,
        }}
        aria-hidden="true"
      />
    );
  }
  return (
    <div style={{ display: 'flex' }}>
      {visible.map((url, i) => (
        <div
          key={i}
          style={{
            width: 32,
            height: 32,
            borderRadius: '34%',
            marginLeft: i === 0 ? 0 : -10,
            background: `url(${url}) center/cover, linear-gradient(135deg, #475569 0%, ${SLATE_800} 100%)`,
            boxShadow: `${HAIRLINE}, 0 0 0 2px rgba(251,188,46,0.55)`,
            zIndex: 3 - i,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function FieldStrengthStrip({
  totalPlayers,
  topRanked,
  topRankedThreshold = 15,
  headshots = [],
}: FieldStrengthStripProps) {
  const { t } = useTranslation('tourhub');
  return (
    <div
      style={{
        background: INK,
        padding: '10px 20px',
        minHeight: STRIP_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 50% 100% at 0% 50%, rgba(251,188,46,0.10) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <StackedHeads photos={headshots} />
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div
          style={{
            fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: GOLD,
            textTransform: 'uppercase',
            marginBottom: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Users size={10} color={GOLD} strokeWidth={2.5} />
          {t('overview.fieldStrength.eyebrow')}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
          }}
        >
          {t('overview.fieldStrength.playersCount', { count: totalPlayers })}
        </div>
        {topRanked != null && topRanked > 0 && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: WHITE_ALPHA_55,
              marginTop: 1,
            }}
          >
            {t('overview.fieldStrength.topRankedLine', { topRanked, threshold: topRankedThreshold })}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', position: 'relative' }}>
        <div
          style={{
            ...NUMERIC_STYLE,
            fontSize: 22,
            fontWeight: 300,
            color: GOLD,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {totalPlayers}
        </div>
        <div
          style={{
            fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.50)',
            letterSpacing: '0.16em',
            marginTop: 2,
          }}
        >
          {t('overview.fieldStrength.inFieldLabel')}
        </div>
      </div>
    </div>
  );
}
