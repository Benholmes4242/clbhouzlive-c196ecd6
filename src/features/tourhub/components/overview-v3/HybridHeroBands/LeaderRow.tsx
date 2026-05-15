/**
 * LeaderRow — solo leader and tied-leaders variants for Live state.
 * §6.3.1 + §6.3.2 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import {
  INK,
  INK_15,
  INK_45,
  GOLD_DARK,
  AMBER,
  GREEN_LIVE,
  FONT_MONO,
} from '../HybridHero.constants';

const LEADER_TINT_LIVE = 'rgba(251,188,46,0.07)';
const LEADER_TINT_RESULTS = 'rgba(251,188,46,0.10)';

function PlayerHead({ size = 36, src }: { size?: number; src?: string | null }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '34%',
        background: src
          ? `url(${src}) center/cover`
          : 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

function liveScoreColour(s: string): string {
  if (s.startsWith('\u2212') || s.startsWith('-')) return GREEN_LIVE;
  if (s.startsWith('+')) return AMBER;
  return INK;
}

interface SoloLeaderRowProps {
  rank: string;
  name: string;
  country?: string;
  score: string;
  thru: string;
  avatarUrl?: string | null;
  isResults?: boolean;
  isLast?: boolean;
}

export function SoloLeaderRow({
  rank,
  name,
  country,
  score,
  thru,
  avatarUrl,
  isResults = false,
  isLast = false,
}: SoloLeaderRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto 42px',
        gap: 12,
        padding: '14px 20px',
        alignItems: 'center',
        background: isResults ? LEADER_TINT_RESULTS : LEADER_TINT_LIVE,
        borderBottom: isLast ? 'none' : `0.5px solid ${INK_15}`,
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 16,
          fontWeight: 800,
          color: GOLD_DARK,
          letterSpacing: '-0.02em',
        }}
      >
        {rank}
      </span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
        <PlayerHead size={36} src={avatarUrl} />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
          </div>
          {country && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: INK_45,
                letterSpacing: '0.04em',
                marginTop: 1,
              }}
            >
              {country}
            </div>
          )}
        </div>
      </div>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 22,
          fontWeight: 700,
          color: isResults ? GOLD_DARK : liveScoreColour(score),
          letterSpacing: '-0.02em',
          fontFeatureSettings: '"tnum" 1, "kern" 1',
        }}
      >
        {score}
      </span>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 11,
          fontWeight: 700,
          color: INK_45,
          textAlign: 'right',
        }}
      >
        {thru}
      </span>
    </div>
  );
}

function StackedAvatars({ count, size = 34 }: { count: number; size?: number }) {
  const visible = Math.min(count, 3);
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {Array.from({ length: visible }).map((_, i) => (
        <div
          key={i}
          style={{
            marginLeft: i === 0 ? 0 : -10,
            zIndex: visible - i,
            opacity: count > 3 && i === visible - 1 ? 0.85 : 1,
            width: size,
            height: size,
            borderRadius: '34%',
            background: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)',
            boxShadow: '0 0 0 2px rgba(251,188,46,0.55)',
          }}
        />
      ))}
    </div>
  );
}

interface TiedLeadersRowProps {
  count: number;
  score: string;
  isLast?: boolean;
}

export function TiedLeadersRow({ count, score, isLast = false }: TiedLeadersRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto',
        gap: 12,
        padding: '14px 20px',
        alignItems: 'center',
        background: LEADER_TINT_LIVE,
        borderBottom: isLast ? 'none' : `0.5px solid ${INK_15}`,
      }}
      aria-label={`${count} players tied at the top with score ${score}`}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 16,
          fontWeight: 800,
          color: GOLD_DARK,
          letterSpacing: '-0.02em',
        }}
      >
        T1
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <StackedAvatars count={count} />
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: INK,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {count} tied at the top
        </div>
      </div>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 22,
          fontWeight: 700,
          color: liveScoreColour(score),
          letterSpacing: '-0.02em',
        }}
      >
        {score}
      </span>
    </div>
  );
}

interface ChampionRowProps {
  rank?: string;
  name: string;
  country?: string;
  score: string;
  playoffWin?: boolean;
  avatarUrl?: string | null;
  isLast?: boolean;
}

export function ChampionRow({
  name,
  country,
  score,
  playoffWin,
  avatarUrl,
  isLast,
}: ChampionRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto 42px',
        gap: 12,
        padding: '14px 20px',
        alignItems: 'center',
        background: LEADER_TINT_RESULTS,
        borderBottom: isLast ? 'none' : `0.5px solid ${INK_15}`,
      }}
    >
      {/* trophy SVG instead of rank */}
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-label="Champion">
          <title>Champion</title>
          <path
            d="M7 4h10v3a5 5 0 0 1-10 0V4z M5 5H3a2 2 0 0 0 2 2V5z M19 5h2a2 2 0 0 1-2 2V5z M9 13h6l-1 4h-4z M8 19h8v2H8z"
            fill={GOLD_DARK}
          />
        </svg>
      </span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
        <PlayerHead size={36} src={avatarUrl} />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
            {playoffWin && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: GOLD_DARK,
                  letterSpacing: '0.12em',
                  marginLeft: 8,
                }}
              >
                * PLAYOFF
              </span>
            )}
          </div>
          {country && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: INK_45,
                letterSpacing: '0.04em',
                marginTop: 1,
              }}
            >
              {country}
            </div>
          )}
        </div>
      </div>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 22,
          fontWeight: 700,
          color: GOLD_DARK,
          letterSpacing: '-0.02em',
        }}
      >
        {score}
      </span>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 11,
          fontWeight: 700,
          color: INK_45,
          textAlign: 'right',
        }}
      >
        F
      </span>
    </div>
  );
}
