/**
 * LeaderboardCard — Overview preview. Flat hairline rhythm, country flags,
 * AMBER_SOFT_BG winner row, columns POS / Player / Today / Total.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CountryFlag from '@/components/ui/country-flag';
import { playerRoute } from '../../routes';
import {
  AMBER_SOFT_BG, GOLD_DEEP, INK, INK_FAINT, INK_MUTE, INK_TINT_07,
  SCORE_OVER_PAR_LIGHT, SURFACE,
} from '../../_shared/tokens';

function abbrevName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0][0].toUpperCase()}. ${parts[parts.length - 1]}`;
}

interface LeaderboardEntry {
  id: string;
  position: number;
  position_tied?: boolean;
  score: number | null;
  thru: number | null;
  status?: string;
  player?: {
    id: string;
    full_name: string;
    country?: string | null;
    country_code?: string | null;
  };
}

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  headshotMap?: Map<string, string>;
  onViewAll?: () => void;
  limit?: number;
  showHeader?: boolean;
  title?: string;
  tournamentName?: string;
}

function fmtScore(s: number | null) {
  if (s === null || s === undefined) return '—';
  if (s === 0) return 'E';
  return s > 0 ? `+${s}` : String(s);
}

function fmtThru(thru: number | null, status?: string) {
  if (status === 'MC' || status === 'CUT') return 'MC';
  if (status === 'WD') return 'WD';
  if (thru === null || thru === undefined) return '—';
  if (thru >= 18) return 'F';
  return String(thru);
}

export function LeaderboardCard({
  entries,
  onViewAll,
  limit = 5,
  showHeader = true,
  title = 'Leaderboard',
  tournamentName,
}: LeaderboardCardProps) {
  const displayEntries = limit === 0 ? entries : entries.slice(0, limit);

  return (
    <motion.div
      style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {showHeader && (
        <div style={{ padding: '14px 16px 10px' }}>
          <span style={{
            fontSize: 9, fontWeight: 800, color: INK_MUTE,
            letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
            {title}
          </span>
        </div>
      )}

      {/* De-boxed column header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '8px 16px',
        borderBottom: `0.5px solid ${INK_TINT_07}`,
      }}>
        <span style={{ width: 40, fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>POS</span>
        <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Player</span>
        <span style={{ width: 52, textAlign: 'right', fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>Today</span>
        <span style={{ width: 48, textAlign: 'right', fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>Total</span>
      </div>

      {displayEntries.map((entry) => {
        const isWinner = entry.position === 1;
        const todayScore = fmtScore(entry.score); // overview preview shows running total as today for finished events
        const totalScore = fmtScore(entry.score);
        const posLabel = entry.status === 'MC' || entry.status === 'CUT' ? 'MC'
          : entry.status === 'WD' ? 'WD'
          : entry.position_tied ? `T${entry.position}` : String(entry.position);

        return (
          <Link
            key={entry.id}
            {...playerRoute(entry.player?.id ?? '', tournamentName ? { kind: 'tournament', tournamentName } : undefined)}
            style={{
              display: 'flex', alignItems: 'center', padding: '10px 16px',
              borderBottom: `0.5px solid ${INK_TINT_07}`,
              background: isWinner ? AMBER_SOFT_BG : 'transparent',
              textDecoration: 'none',
            }}
            className="active:bg-black/[0.02] transition-colors"
          >
            <span style={{
              width: 40, flexShrink: 0, fontSize: 13, fontWeight: 800,
              color: isWinner ? GOLD_DEEP : INK, fontVariantNumeric: 'tabular-nums',
            }}>{posLabel}</span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <CountryFlag country={entry.player?.country ?? entry.player?.country_code} size="sm" />
              <span style={{
                fontSize: 14, fontWeight: isWinner ? 800 : 600, color: INK,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {abbrevName(entry.player?.full_name || 'Unknown')}
              </span>
            </div>
            <span style={{ width: 52, flexShrink: 0, textAlign: 'right', fontSize: 13, fontWeight: 600, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>
              {fmtThru(entry.thru, entry.status) === 'F' || fmtThru(entry.thru, entry.status) === 'MC' || fmtThru(entry.thru, entry.status) === 'WD'
                ? todayScore
                : todayScore}
            </span>
            <span style={{
              width: 48, flexShrink: 0, textAlign: 'right', fontSize: 14, fontWeight: 800,
              color: (entry.score ?? 0) < 0 ? SCORE_OVER_PAR_LIGHT : INK,
              fontVariantNumeric: 'tabular-nums',
            }}>{totalScore}</span>
          </Link>
        );
      })}

      {onViewAll && (
        <button
          onClick={onViewAll}
          style={{
            width: '100%', padding: '14px 0', fontSize: 12, fontWeight: 700,
            color: INK, background: 'transparent', border: 'none',
            borderTop: `0.5px solid ${INK_TINT_07}`, cursor: 'pointer',
          }}
          className="active:opacity-70 transition-opacity"
        >
          Full Leaderboard ›
        </button>
      )}
    </motion.div>
  );
}
