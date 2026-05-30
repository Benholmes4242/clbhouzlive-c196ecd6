/**
 * ChampionStrip — gold-tinted single-player strip.
 * Reused by Results (champion / playoff winner) and Upcoming (defending champion / fallbacks).
 * §5.2.1 + §5.3 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import { Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { INK, GOLD, NUMERIC_STYLE, STRIP_HEIGHT } from '../HybridHero.constants';
import { TrajectorySparkline } from './TrajectorySparkline';

interface ChampionStripProps {
  name: string;
  country?: string;
  score: string;
  scoreLabel?: string;
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  /** Optional avatar URL — when missing, render a gradient placeholder */
  avatarUrl?: string | null;
  /** Pass 3: per-round scores for the winner's trajectory sparkline. */
  rounds?: number[];
  /** Pass 3: course par used to render the sparkline. */
  par?: number;
  /** Pass 5.5: italic editorial narrative beneath the name. */
  narrative?: string | null;
}


function PlayerHead({ size = 42, src }: { size?: number; src?: string | null }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '34%',
        background: src
          ? `url(${src}) center/cover`
          : 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
        boxShadow: '0 0 0 2px rgba(251,188,46,0.55)',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

export function ChampionStrip({
  name,
  country,
  score,
  scoreLabel = 'TO PAR',
  eyebrow = 'CHAMPION',
  eyebrowIcon: EyebrowIcon = Trophy,
  avatarUrl,
  rounds,
  par,
  narrative,
}: ChampionStripProps) {
  const hasNarrative = !!(narrative && narrative.trim().length > 0);

  return (
    <div
      style={{
        background: INK,
        padding: hasNarrative ? '12px 20px 14px' : '10px 20px',
        minHeight: hasNarrative ? undefined : STRIP_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        gap: hasNarrative ? 8 : 0,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
        <PlayerHead size={42} src={avatarUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.18em',
                color: GOLD,
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <EyebrowIcon size={10} color={GOLD} strokeWidth={2.5} />
              {eyebrow}
            </span>
            {country && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.50)',
                  letterSpacing: '0.04em',
                }}
              >
                · {country}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>
        </div>
        {rounds && rounds.length >= 2 && par ? (
          <div style={{ marginRight: 10, display: 'flex', alignItems: 'center' }}>
            <TrajectorySparkline rounds={rounds} par={par} variant="champion" totalRounds={4} />
          </div>
        ) : null}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              ...NUMERIC_STYLE,
              fontSize: 26,
              fontWeight: 300,
              color: GOLD,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontFeatureSettings: '"tnum" 1, "kern" 1',
            }}
          >
            {score}
          </div>
        </div>
      </div>

      {hasNarrative && (
        <div
          aria-label="Tournament narrative"
          style={{
            position: 'relative',
            color: 'rgba(255,255,255,0.65)',
            fontSize: 12,
            fontWeight: 400,
            fontStyle: 'italic',
            lineHeight: 1.4,
            letterSpacing: '-0.005em',
            fontFamily: "'Geist', sans-serif",
          }}
        >
          {narrative}
        </div>
      )}
    </div>
  );
}

export function CancelledStrip({ reason }: { reason: string }) {
  return (
    <div
      style={{
        background: INK,
        padding: '14px 20px',
        minHeight: STRIP_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="#FCA5A5" strokeWidth="1.5" />
        <path d="M6 6L14 14M14 6L6 14" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.18em',
            color: '#FCA5A5',
            textTransform: 'uppercase',
            marginBottom: 2,
          }}
        >
          CANCELLED
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'white',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {reason}
        </div>
      </div>
    </div>
  );
}

interface PlayoffStripProps {
  count: number;
  score: string;
}

export function PlayoffStrip({ count, score }: PlayoffStripProps) {
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
      <div style={{ display: 'flex' }}>
        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 36,
              height: 36,
              borderRadius: '34%',
              marginLeft: i === 0 ? 0 : -10,
              background: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
              boxShadow: '0 0 0 2px rgba(251,188,46,0.55)',
              zIndex: 3 - i,
              opacity: count > 3 && i === 2 ? 0.85 : 1,
            }}
          />
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: GOLD, marginBottom: 2 }}>
          🏆 AWAITING PLAYOFF
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>
          {count} tied at the top
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            ...NUMERIC_STYLE,
            fontSize: 26,
            fontWeight: 300,
            color: GOLD,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {score}
        </div>
        <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.50)', letterSpacing: '0.16em', marginTop: 2 }}>
          TO PAR
        </div>
      </div>
    </div>
  );
}
