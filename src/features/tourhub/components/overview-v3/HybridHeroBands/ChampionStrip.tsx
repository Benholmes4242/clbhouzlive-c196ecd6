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
 * ChampionStrip — gold-tinted single-player strip.
 * Reused by Results (champion / playoff winner) and Upcoming (defending champion / fallbacks).
 * §5.2.1 + §5.3 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { GOLD, NUMERIC_STYLE, STRIP_HEIGHT } from '../HybridHero.constants';
import { CHAMPION_STRIP_WASH, SURFACE, WHITE_ALPHA_06, WHITE_ALPHA_65 } from '../../../_shared/tokens';
import { getScoreColor } from '../../../_shared/scoreColor';
import { TrajectorySparkline } from './TrajectorySparkline';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import CountryFlag from '@/components/ui/country-flag';

interface ChampionStripProps {
  name: string;
  country?: string;
  score: string;
  /** Numeric to-par behind `score` — drives the canonical getScoreColor treatment (CORRECTION 1: score is to-par colour, never gold). */
  scoreValue?: number | null;
  scoreLabel?: string;
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  /** Optional avatar URL — when missing, render a gradient placeholder */
  avatarUrl?: string | null;
  /** Per-round TO-PAR figures (round_N) for the winner's trajectory sparkline — not strokes. */
  rounds?: number[];
  /** Event round count, from roundsFromSchedule — the one derivation. */
  totalRounds?: number;
  /** Pass 5.5: italic editorial narrative beneath the name. */
  narrative?: string | null;
}


function PlayerHead({ size = 42, src }: { size?: number; src?: string | null }) {
  return (
    <SquircleAvatar
      src={src ?? undefined}
      size={size}
      hairlineRing
      ringColor={GOLD}
    />
  );
}

export function ChampionStrip({
  name,
  country,
  score,
  scoreValue,
  scoreLabel,
  eyebrow,
  eyebrowIcon: EyebrowIcon = Trophy,
  avatarUrl,
  rounds,
  totalRounds,
  narrative,
}: ChampionStripProps) {
  const { t } = useTranslation('tourhub');
  const resolvedEyebrow = eyebrow ?? t('overview.champion.eyebrow');
  const hasNarrative = !!(narrative && narrative.trim().length > 0);

  return (
    <div
      style={{
        background: SURFACE,
        padding: hasNarrative ? '12px 20px 14px' : '10px 20px',
        minHeight: hasNarrative ? undefined : STRIP_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        gap: hasNarrative ? 8 : 0,
        borderTop: `0.5px solid ${WHITE_ALPHA_06}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: CHAMPION_STRIP_WASH,
          pointerEvents: 'none',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
        <PlayerHead size={42} src={avatarUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span
              style={{
                fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: GOLD,
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <EyebrowIcon size={10} color={GOLD} strokeWidth={2.5} />
              {resolvedEyebrow}
            </span>
            {country && <CountryFlag country={country} size="sm" />}
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.01em',
              display: 'block',
              whiteSpace: 'normal',
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>
        </div>
        {rounds && rounds.length >= 2 ? (
          <div style={{ marginRight: 10, display: 'flex', alignItems: 'center' }}>
            <TrajectorySparkline rounds={rounds} variant="champion" totalRounds={totalRounds} />
          </div>
        ) : null}
        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          <div
            style={{
              ...NUMERIC_STYLE,
              fontSize: 26,
              // Weight matches the board's TOT figures below (700) — the
              // champion's score must not read lighter than the same figure
              // in row 1 of the board.
              fontWeight: 700,
              // CORRECTION 1 (BRIEF_TOUR_OVERVIEW_CHAMPION): the score takes the
              // canonical to-par ramp — red under par, muted even — never gold.
              // Gold stays on the eyebrow, trophy glyph and avatar ring only.
              color: getScoreColor(scoreValue ?? null, 'dark'),
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontFeatureSettings: '"tnum" 1, "kern" 1',
            }}
          >
            {score}
          </div>
          {scoreLabel && (
            <div
              style={{
                fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.50)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              {scoreLabel}
            </div>
          )}
        </div>
      </div>

      {hasNarrative && (
        <div
          aria-label="Tournament narrative"
          style={{
            position: 'relative',
            color: WHITE_ALPHA_65,
            fontSize: 12,
            fontWeight: 400,
            fontStyle: 'italic',
            lineHeight: 1.4,
            letterSpacing: '-0.005em',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {narrative}
        </div>
      )}
    </div>
  );
}
