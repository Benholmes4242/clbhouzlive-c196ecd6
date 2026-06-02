/**
 * TeamFinishRow — leaderboard row variant for team events (e.g. LIV).
 * Renders a 28×28 (or 36×36 for champion) team-crest tile in place of a player headshot.
 * Per TOUR_HUB_POLISH_PATCH_BRIEF §3.
 */

import React from 'react';
import { INK, INK_45, INK_15, GOLD_DARK, NUMERIC_STYLE } from '../HybridHero.constants';

import { SLATE_700, SLATE_800 } from '../../../_shared/tokens';

export interface TeamFinishRowProps {
  rank: string;                    // "1" / "T2" / etc
  teamName: string;
  teamColor?: string | null;
  teamCrestUrl?: string | null;
  members?: { fullName: string }[];
  score: string;                   // formatted with Unicode minus
  thru?: string;                   // typically "F"
  isResults?: boolean;
  isLast?: boolean;
  isChampion?: boolean;
}

function surnameOnly(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

function TeamCrestTile({
  teamName,
  teamColor,
  teamCrestUrl,
  size,
  isChampion,
}: {
  teamName: string;
  teamColor?: string | null;
  teamCrestUrl?: string | null;
  size: number;
  isChampion?: boolean;
}) {
  const radius = Math.round(size * 0.22);
  if (teamCrestUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: `url(${teamCrestUrl}) center/cover, ${teamColor || SLATE_800}`,
          boxShadow: isChampion ? '0 0 0 1.5px rgba(212,160,23,0.45)' : 'inset 0 0 0 0.5px rgba(15,23,42,0.10)',
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
    );
  }

  const initial = (teamName.charAt(0) || '·').toUpperCase();
  const bg = teamColor
    ? `linear-gradient(135deg, ${teamColor} 0%, ${teamColor} 100%)`
    : `linear-gradient(135deg, #475569 0%, ${SLATE_700} 100%)`;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        boxShadow: isChampion ? '0 0 0 1.5px rgba(212,160,23,0.45)' : 'inset 0 0 0 0.5px rgba(15,23,42,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        ...NUMERIC_STYLE,
        fontWeight: 800,
        fontSize: Math.round(size * 0.5),
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

function TrophyIcon({ size = 16, color = GOLD_DARK }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4h10v3a5 5 0 0 1-10 0V4zm-3 1h3v2a3 3 0 0 1-3-3V5zm13 0h3v-1a3 3 0 0 1-3 3V5zM10 13h4l-.5 3h-3l-.5-3zm-2 5h8v2H8v-2z"
        fill={color}
      />
    </svg>
  );
}

export function TeamFinishRow({
  rank,
  teamName,
  teamColor,
  teamCrestUrl,
  members,
  score,
  thru = 'F',
  isResults = true,
  isLast = false,
  isChampion = false,
}: TeamFinishRowProps) {
  const hideThru = isResults;
  const memberSubtext =
    members && members.length > 0
      ? members.slice(0, 2).map(m => surnameOnly(m.fullName)).filter(Boolean).join(' · ')
      : null;

  const height = isChampion ? 64 : 48;
  const tileSize = isChampion ? 36 : 28;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 20px',
        height,
        borderBottom: 'none',
        background: isChampion ? 'rgba(212,160,23,0.05)' : 'transparent',
        position: 'relative',
      }}
    >
      {/* Rank or trophy */}
      <div
        style={{
          width: 22,
          ...NUMERIC_STYLE,
          fontSize: isChampion ? 12 : 11,
          fontWeight: 700,
          color: INK_45,
          textAlign: 'center',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isChampion ? <TrophyIcon size={16} /> : rank}
      </div>

      {/* Crest + identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <TeamCrestTile
          teamName={teamName}
          teamColor={teamColor}
          teamCrestUrl={teamCrestUrl}
          size={tileSize}
          isChampion={isChampion}
        />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              fontSize: isChampion ? 15 : 14,
              fontWeight: isChampion ? 800 : 700,
              color: INK,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.15,
            }}
          >
            {teamName}
          </div>
          {isChampion && memberSubtext && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: INK_45,
                letterSpacing: '0.02em',
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {memberSubtext}
            </div>
          )}
        </div>
      </div>

      {/* Score */}
      <div
        style={{
          ...NUMERIC_STYLE,
          fontSize: isChampion ? 18 : 15,
          fontWeight: isChampion ? 700 : 600,
          color: isChampion ? GOLD_DARK : INK,
          letterSpacing: '-0.02em',
          fontFeatureSettings: '"tnum" 1, "kern" 1',
          minWidth: 36,
          textAlign: 'right',
        }}
      >
        {score}
      </div>

      {!hideThru && (
        <div
          style={{
            ...NUMERIC_STYLE,
            fontSize: 11,
            fontWeight: 600,
            color: INK_45,
            letterSpacing: '0.02em',
            width: 18,
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          {thru}
        </div>
      )}
    </div>
  );
}
