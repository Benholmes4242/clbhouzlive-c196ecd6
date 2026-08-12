/**
 * LeaderRow — solo leader and tied-leaders variants for Live state.
 * §6.3.1 + §6.3.2 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';

import {
  INK,
  INK_15,
  INK_45,
  GOLD_DARK,
  NUMERIC_STYLE,
} from '../HybridHero.constants';
import { getScoreColor } from '../../../_shared/scoreColor';
import { AMBER_TINT_04, LEADER_GOLD_TINT_10, LEADER_GOLD_TINT_7 } from '../../../_shared/tokens';
import { TrajectorySparkline } from './TrajectorySparkline';
import { todayFromEntry } from '../HybridHero.utils';

function liveScoreColour(s: string): string {
  if (s.startsWith('\u2212') || s.startsWith('-')) return getScoreColor(-1, 'dark', 'standard');
  if (s.startsWith('+')) return getScoreColor(1, 'dark', 'standard');
  return getScoreColor(0, 'dark', 'standard');
}

interface SoloLeaderRowProps {
  rank: string;
  name: string;
  country?: string | null;
  score: string;
  thru: string;
  today?: number | null;
  /** Ordered multi-folder candidate URLs (resolvePlayerAvatarCandidates output). */
  avatarCandidates?: (string | null | undefined)[];
  /** Stable id used to derive the deterministic initials colour. */
  playerId?: string | null;
  isResults?: boolean;
  isLast?: boolean;
}

export function SoloLeaderRow({
  rank,
  name,
  country,
  score,
  thru,
  today,
  avatarCandidates,
  playerId,
  isResults = false,
  isLast = false,
}: SoloLeaderRowProps) {
  const hideThru = isResults;
  const todayDisplay = today != null ? (today === 0 ? 'E' : today > 0 ? `+${today}` : String(today)) : '—';
  const todayColor = today != null ? liveScoreColour(todayDisplay) : INK_45;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: hideThru ? '32px 1fr auto' : '32px 1fr 42px 42px auto',
        gap: 12,
        padding: '14px 20px',
        alignItems: 'center',
        background: isResults ? LEADER_GOLD_TINT_10 : LEADER_GOLD_TINT_7,
        borderBottom: 'none',
      }}
    >
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 16,
          fontWeight: 700,
          color: GOLD_DARK,
          letterSpacing: '-0.02em',
        }}
      >
        {rank}
      </span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
        <SquircleAvatar
          size={36}
          srcCandidates={avatarCandidates}
          alt={name}
          userId={playerId ?? name}
          hairlineRing ringColor={LIGHT_HAIRLINE}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
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
      {!hideThru && (
        <span
          style={{
            ...NUMERIC_STYLE,
            fontSize: 11,
            fontWeight: 700,
            color: INK_45,
            textAlign: 'right',
          }}
        >
          {thru}
        </span>
      )}
      {!hideThru && (
        <span
          style={{
            ...NUMERIC_STYLE,
            fontSize: 13,
            fontWeight: 700,
            color: todayColor,
            textAlign: 'right',
          }}
        >
          {todayDisplay}
        </span>
      )}
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 22,
          fontWeight: 700,
          color: isResults ? GOLD_DARK : liveScoreColour(score),
          letterSpacing: '-0.02em',
          fontFeatureSettings: '"tnum" 1, "kern" 1',
          textAlign: 'right',
        }}
      >
        {score}
      </span>
    </div>
  );
}

export interface StackedAvatarPlayer {
  /** Ordered multi-folder candidate URLs (resolvePlayerAvatarCandidates output). */
  avatarCandidates?: (string | null | undefined)[];
  /** Optional stable id for deterministic initials colour. */
  playerId?: string | null;
  /** Optional player name for alt + initials fallback. */
  name?: string | null;
  rounds?: number[];
}

export function StackedAvatars({
  players,
  size = 34,
  variant = 'leader',
}: {
  players: StackedAvatarPlayer[];
  size?: number;
  variant?: 'leader' | 'chaser';
}) {
  const maxVisible = variant === 'chaser' ? 4 : 3;
  const visible = players.slice(0, maxVisible);
  const total = players.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((p, i) => (
        <div
          key={i}
          style={{
            marginLeft: i === 0 ? 0 : -8,
            zIndex: visible.length - i,
            opacity: total > maxVisible && i === visible.length - 1 ? 0.85 : 1,
          }}
        >
          <SquircleAvatar
            size={size}
            srcCandidates={p.avatarCandidates}
            alt={p.name ?? ''}
            userId={p.playerId ?? p.name ?? ''}
            hairlineRing ringColor={LIGHT_HAIRLINE}
          />
        </div>
      ))}
    </div>
  );
}

interface TiedChasersRowProps {
  rank: string;
  count: number;
  score: string;
  thru: string;
  today?: number | null;
  players: StackedAvatarPlayer[];
  par?: number;
  isLast?: boolean;
  isResults?: boolean;
  onTap?: () => void;
}

function averageRounds(players: { rounds?: number[] }[]): number[] {
  if (!players.length) return [];
  const allRounds = players.map(p => p.rounds ?? []).filter(r => r.length > 0);
  if (allRounds.length === 0) return [];
  const minLen = Math.min(...allRounds.map(r => r.length));
  if (minLen < 2) return [];
  const avgs: number[] = [];
  for (let i = 0; i < minLen; i++) {
    const sum = allRounds.reduce((a, r) => a + r[i], 0);
    avgs.push(sum / allRounds.length);
  }
  return avgs;
}

export function TiedChasersRow({
  rank,
  count,
  score,
  thru,
  today,
  players,
  par,
  isLast = false,
  isResults = false,
  onTap,
}: TiedChasersRowProps) {
  const { t } = useTranslation('tourhub');
  const avgRounds = averageRounds(players);
  const hideThru = isResults;
  const todayDisplay = today != null ? (today === 0 ? 'E' : today > 0 ? `+${today}` : String(today)) : '—';
  const todayColor = today != null ? liveScoreColour(todayDisplay) : INK_45;
  return (
    <div
      onClick={onTap}
      style={{
        display: 'grid',
        gridTemplateColumns: hideThru ? '32px 1fr 36px auto' : '32px 1fr 36px 42px 42px auto',
        gap: 12,
        padding: '8px 20px',
        height: 40,
        alignItems: 'center',
        background: AMBER_TINT_04,
        borderBottom: 'none',
        cursor: onTap ? 'pointer' : 'default',
      }}
      aria-label={t('overview.leaderRow.tiedAtRankAria', { count, rank, score })}
    >
      <span style={{ ...NUMERIC_STYLE, fontSize: 13, fontWeight: 700, color: INK_45 }}>
        {rank}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <StackedAvatars players={players} size={22} variant="chaser" />
        <span style={{ fontSize: 14, fontWeight: 700, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
          {t('overview.leaderRow.tiedAtRank', { count, rank })}
          <ChevronRight size={11} strokeWidth={2.5} color={INK_45} style={{ marginLeft: 4, flexShrink: 0 }} />
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <TrajectorySparkline
          rounds={avgRounds}
          par={par ?? 0}
          variant="tied"
          totalRounds={4}
          ariaHidden
        />
      </div>
      {!hideThru && (
        <span style={{ ...NUMERIC_STYLE, fontSize: 11, fontWeight: 700, color: INK_45, textAlign: 'right' }}>
          {thru}
        </span>
      )}
      {!hideThru && (
        <span style={{ ...NUMERIC_STYLE, fontSize: 13, fontWeight: 700, color: todayColor, textAlign: 'right' }}>
          {todayDisplay}
        </span>
      )}
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 16,
          fontWeight: 700,
          color: INK,
          letterSpacing: '-0.01em',
          textAlign: 'right',
        }}
      >
        {score}
      </span>
    </div>
  );
}



interface TiedLeadersRowProps {
  count: number;
  score: string;
  today?: number | null;
  players?: StackedAvatarPlayer[];
  isLast?: boolean;
}

export function TiedLeadersRow({ count, score, today, players, isLast = false }: TiedLeadersRowProps) {
  const { t } = useTranslation('tourhub');
  const stack: StackedAvatarPlayer[] = players && players.length > 0
    ? players
    : Array.from({ length: count }, () => ({}));
  const todayDisplay = today != null ? (today === 0 ? 'E' : today > 0 ? `+${today}` : String(today)) : '—';
  const todayColor = today != null ? liveScoreColour(todayDisplay) : INK_45;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 42px 42px auto',
        gap: 12,
        padding: '14px 20px',
        alignItems: 'center',
        background: LEADER_GOLD_TINT_7,
        borderBottom: 'none',
      }}
      aria-label={t('overview.leaderRow.tiedAtTopAria', { count, score })}
    >
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 16,
          fontWeight: 700,
          color: GOLD_DARK,
          letterSpacing: '-0.02em',
        }}
      >
        {/* NEVER-KEY: score/rank token */}
        {/* eslint-disable-next-line i18next/no-literal-string */}
        T1
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <StackedAvatars players={stack} />
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {t('overview.leaderRow.tiedAtTop', { count })}
        </div>
      </div>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 11,
          fontWeight: 700,
          color: INK_45,
          textAlign: 'right',
        }}
      >
        {/* NEVER-KEY: thru/score token */}
        {/* eslint-disable-next-line i18next/no-literal-string */}
        —
      </span>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 13,
          fontWeight: 700,
          color: todayColor,
          textAlign: 'right',
        }}
      >
        {todayDisplay}
      </span>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 22,
          fontWeight: 700,
          color: liveScoreColour(score),
          letterSpacing: '-0.02em',
          textAlign: 'right',
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
  country?: string | null;
  score: string;
  today?: number | null;
  playoffWin?: boolean;
  avatarUrl?: string | null;
  isLast?: boolean;
}

export function ChampionRow({
  name,
  country,
  score,
  today,
  playoffWin,
  avatarUrl,
  isLast,
}: ChampionRowProps) {
  const { t } = useTranslation('tourhub');
  const championLabel = t('overview.leaderRow.championIconLabel');
  const todayDisplay = today != null ? (today === 0 ? 'E' : today > 0 ? `+${today}` : String(today)) : '—';
  const todayColor = today != null ? liveScoreColour(todayDisplay) : INK_45;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 42px 42px auto',
        gap: 12,
        padding: '14px 20px',
        alignItems: 'center',
        background: LEADER_GOLD_TINT_10,
        borderBottom: 'none',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-label={championLabel}>
          <title>{championLabel}</title>
          <path
            d="M7 4h10v3a5 5 0 0 1-10 0V4z M5 5H3a2 2 0 0 0 2 2V5z M19 5h2a2 2 0 0 1-2 2V5z M9 13h6l-1 4h-4z M8 19h8v2H8z"
            fill={GOLD_DARK}
          />
        </svg>
      </span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
        <SquircleAvatar
          size={36}
          src={avatarUrl ?? undefined}
          alt={name}
          userId={name}
          hairlineRing ringColor={LIGHT_HAIRLINE}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
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
                {t('overview.leaderRow.playoffMarker')}
              </span>
            )}
          </span>
          {country && <CountryFlag country={country} size="sm" />}
        </div>
      </div>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 11,
          fontWeight: 700,
          color: INK_45,
          textAlign: 'right',
        }}
      >
        {/* NEVER-KEY: thru/score token */}
        {/* eslint-disable-next-line i18next/no-literal-string */}
        F
      </span>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 13,
          fontWeight: 700,
          color: todayColor,
          textAlign: 'right',
        }}
      >
        {todayDisplay}
      </span>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 22,
          fontWeight: 700,
          color: GOLD_DARK,
          letterSpacing: '-0.02em',
          textAlign: 'right',
        }}
      >
        {score}
      </span>
    </div>
  );
}
