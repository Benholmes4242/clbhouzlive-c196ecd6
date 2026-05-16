/**
 * LeaderRow — solo leader and tied-leaders variants for Live state.
 * §6.3.1 + §6.3.2 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import CountryFlag from '@/components/ui/country-flag';
import { PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
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

function PlayerHead({ size = 36, src, ring }: { size?: number; src?: string | null; ring?: boolean }) {
  return (
    <img
      src={src || PLAYER_SILHOUETTE_URL}
      alt=""
      onError={(e) => {
        const t = e.target as HTMLImageElement;
        if (t.src !== PLAYER_SILHOUETTE_URL) t.src = PLAYER_SILHOUETTE_URL;
      }}
      style={{
        width: size,
        height: size,
        borderRadius: '34%',
        objectFit: 'cover',
        objectPosition: 'center 18%',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)',
        border: ring ? '1.5px solid white' : '0.5px solid rgba(15,23,42,0.10)',
      }}
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
  country?: string | null;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
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
          </span>
          {country && <CountryFlag country={country} size="sm" />}
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

function StackedAvatars({
  players,
  size = 34,
}: {
  players: { avatarUrl?: string | null }[];
  size?: number;
}) {
  const visible = players.slice(0, 3);
  const total = players.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((p, i) => (
        <img
          key={i}
          src={p.avatarUrl || PLAYER_SILHOUETTE_URL}
          alt=""
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            if (t.src !== PLAYER_SILHOUETTE_URL) t.src = PLAYER_SILHOUETTE_URL;
          }}
          style={{
            marginLeft: i === 0 ? 0 : -10,
            zIndex: visible.length - i,
            opacity: total > 3 && i === visible.length - 1 ? 0.85 : 1,
            width: size,
            height: size,
            borderRadius: '34%',
            objectFit: 'cover',
            objectPosition: 'center 18%',
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
  players?: { avatarUrl?: string | null }[];
  isLast?: boolean;
}

export function TiedLeadersRow({ count, score, players, isLast = false }: TiedLeadersRowProps) {
  const stack = players && players.length > 0 ? players : Array.from({ length: count }, () => ({ avatarUrl: null }));
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
        <StackedAvatars players={stack} />
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

interface TiedGroupRowProps {
  rank: string;            // pre-formatted, e.g. "T1", "T3"
  count: number;
  score: string;           // pre-formatted, e.g. "−4"
  players?: { avatarUrl?: string | null }[];
  isChampion?: boolean;    // true ONLY when rank === "T1"
  thru?: string;           // omitted for live, "F" for results
  isLast?: boolean;
}

export function TiedGroupRow({
  rank,
  count,
  score,
  players,
  isChampion = false,
  thru,
  isLast = false,
}: TiedGroupRowProps) {
  const stack =
    players && players.length > 0
      ? players
      : Array.from({ length: count }, () => ({ avatarUrl: null }));
  const copy = isChampion ? `${count} tied at the top` : `${count} players tied`;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto 42px',
        gap: 12,
        padding: '14px 20px',
        alignItems: 'center',
        background: isChampion ? LEADER_TINT_LIVE : 'transparent',
        borderBottom: isLast ? 'none' : `0.5px solid ${INK_15}`,
      }}
      aria-label={`${count} players tied at position ${rank.replace(/^T/, '')} with score ${score}`}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 16,
          fontWeight: 800,
          color: isChampion ? GOLD_DARK : INK_45,
          letterSpacing: '-0.02em',
        }}
      >
        {rank}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <StackedAvatars players={stack} />
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
          {copy}
        </div>
      </div>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 22,
          fontWeight: 700,
          color: isChampion ? GOLD_DARK : liveScoreColour(score),
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
        {thru ?? ''}
      </span>
    </div>
  );
}

interface ChampionRowProps {
  rank?: string;
  name: string;
  country?: string | null;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
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
          </span>
          {country && <CountryFlag country={country} size="sm" />}
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
