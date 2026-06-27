/**
 * FullLeaderboard - Expanded dispatch tournament leaderboard
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import CountryFlag from '@/components/ui/country-flag';
import { formatThruDisplay } from '../../utils/formatThruDisplay';
import { playerRoute } from '../../routes';
import { AMBER, AMBER_SOFT_BG, GOLD_DEEP, HAIRLINE_INK_12, INK, INK_FAINT, INK_LIGHT, INK_MUTE, INK_TINT_02, INK_TINT_05, INK_TINT_07, LEADER_GOLD_TINT_10, SCORE_UNDER_PAR_LIGHT, SURFACE } from '../../_shared/tokens';
import { roundStarted } from '../../_shared/roundState';

interface RawRoundData {
  thru?: number;
  score?: number;
  strokes?: number;
  sequence?: number;
}

interface FullLeaderboardEntry {
  id: string;
  position: number;
  position_tied?: boolean;
  score: number | null;
  strokes: number | null;
  thru: number | null;
  money: number | null;
  status?: string;
  thru_updated_at?: string | null;
  round_1?: number | null;
  round_2?: number | null;
  round_3?: number | null;
  round_4?: number | null;
  raw_data?: any;
  player?: {
    id: string;
    full_name: string;
    photo_url?: string | null;
    country?: string | null;
    country_code?: string | null;
  };
}

function getLiveRoundData(entry: FullLeaderboardEntry, roundNum: number): { score: number | null; thru: number | null } | null {
  const rounds = (entry.raw_data as any)?.rounds as RawRoundData[] | undefined;
  if (!rounds || rounds.length < roundNum) return null;
  const round = rounds[roundNum - 1];
  if (!roundStarted(round)) return null;
  return { score: round.score ?? null, thru: round.thru ?? null };
}

interface FullLeaderboardProps {
  entries: FullLeaderboardEntry[];
  headshotMap?: Map<string, string>;
  tournamentStatus?: string;
  tournamentTimezone?: string | null;
  tournamentName?: string;
  venuePar?: number | null;
  onPlayerTap?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  hideSearchInput?: boolean;
}

function ScoreToPar({ score, className, emphasis, size }: { score: number | null; className?: string; emphasis?: boolean; size?: number }) {
  if (score === null) return <span className={cn(className)} style={{ fontVariantNumeric: 'tabular-nums', color: INK }}>-</span>;
  const formatted = score === 0 ? 'E' : score > 0 ? `+${score}` : String(score);
  const color = score < 0 ? SCORE_UNDER_PAR_LIGHT : INK;
  return (
    <span className={cn(className)} style={{
      fontVariantNumeric: 'tabular-nums',
      color,
      fontWeight: emphasis ? 800 : 500,
      fontSize: size ? `${size}px` : undefined,
      letterSpacing: emphasis ? '-0.01em' : undefined,
    }}>
      {formatted}
    </span>
  );
}

function abbrevName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0][0].toUpperCase()}. ${parts[parts.length - 1]}`;
}

const rowVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: Math.min(i * 0.02, 0.6), duration: 0.25 },
  }),
};

export function FullLeaderboard({
  entries,
  headshotMap,
  tournamentStatus,
  tournamentTimezone,
  tournamentName,
  venuePar,
  onPlayerTap,
  searchQuery: searchQueryProp,
  onSearchChange,
  hideSearchInput,
}: FullLeaderboardProps) {
  // null = overall sort; 1-4 = sort by that round's score
  const [sortRound, setSortRound] = useState<number | null>(null);
  const [localQuery, setLocalQuery] = useState('');
  const searchQuery = searchQueryProp ?? localQuery;
  const setSearchQuery = onSearchChange ?? setLocalQuery;

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(e => e.player?.full_name?.toLowerCase().includes(q));
  }, [entries, searchQuery]);

  const sortedEntries = useMemo(() => {
    if (sortRound == null) return filteredEntries;
    const roundKey = `round_${sortRound}` as keyof FullLeaderboardEntry;
    return [...filteredEntries].sort((a, b) => {
      const aDone = a[roundKey] as number | null;
      const bDone = b[roundKey] as number | null;
      if (aDone != null && bDone != null) return aDone - bDone;
      if (aDone != null) return -1;
      if (bDone != null) return 1;
      const aLive = getLiveRoundData(a, sortRound)?.score ?? null;
      const bLive = getLiveRoundData(b, sortRound)?.score ?? null;
      if (aLive == null && bLive == null) return 0;
      if (aLive == null) return 1;
      if (bLive == null) return -1;
      return aLive - bLive;
    });
  }, [filteredEntries, sortRound]);

  const cutLineIndex = useMemo(() => {
    if (sortRound != null) return -1;
    let lastActiveIdx = -1;
    for (let i = 0; i < sortedEntries.length; i++) {
      const status = sortedEntries[i].status;
      if (status !== 'MC' && status !== 'CUT' && status !== 'WD') {
        lastActiveIdx = i;
      }
    }
    if (lastActiveIdx >= 0 && lastActiveIdx < sortedEntries.length - 1) {
      const nextStatus = sortedEntries[lastActiveIdx + 1]?.status;
      if (nextStatus === 'MC' || nextStatus === 'CUT') return lastActiveIdx;
    }
    return -1;
  }, [sortedEntries, sortRound]);

  const isLive = tournamentStatus === 'inprogress';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Search input */}
      <div style={{ padding: '14px 20px 8px', position: 'relative' }}>
        <Search className="absolute left-[32px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] z-10" style={{ color: INK }} strokeWidth={2.5} />
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-9 rounded-xl text-[13px] bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400/60 transition-all"
        />
        <AnimatePresence>
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setSearchQuery('')}
              className="absolute right-[32px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* De-boxed column header — single bottom hairline, no INK_TINT_02 strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '8px 16px', borderTop: `0.5px solid ${INK_TINT_07}`, borderBottom: `0.5px solid ${INK_TINT_07}` }}>
        <span style={{ width: '24px', fontSize: '10px', fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', flexShrink: 0, textTransform: 'uppercase' }}>POS</span>
        <span style={{ flex: 1, fontSize: '10px', fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Player</span>
        {[1, 2, 3, 4].map((r) => {
          const active = sortRound === r;
          return (
            <button
              key={r}
              onClick={() => setSortRound(active ? null : r)}
              aria-pressed={active}
              aria-label={`Sort by round ${r}`}
              style={{
                width: '21px', textAlign: 'center', fontSize: '10px', fontWeight: 700,
                color: active ? INK : INK_MUTE, letterSpacing: '0.08em', flexShrink: 0,
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontVariantNumeric: 'tabular-nums', textTransform: 'uppercase',
              }}
            >
              R{r}{active ? '▾' : ''}
            </button>
          );
        })}
        <button
          onClick={() => setSortRound(null)}
          aria-pressed={sortRound == null}
          aria-label="Sort by total"
          style={{
            width: '40px', textAlign: 'center', fontSize: '10px', fontWeight: 700,
            color: sortRound == null ? INK : INK_MUTE, letterSpacing: '0.08em', flexShrink: 0,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          TOT{sortRound == null ? '▾' : ''}
        </button>
        <span style={{ width: '48px', textAlign: 'center' as const, fontSize: '10px', fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', flexShrink: 0, textTransform: 'uppercase' }}>Thru</span>
      </div>

      {/* Player rows */}
      <div style={{ background: SURFACE, borderBottom: `1px solid ${INK_TINT_07}` }}>
        {sortedEntries.map((entry, index) => {
          const isMissedCut = entry.status === 'MC' || entry.status === 'CUT';
          const isWD = entry.status === 'WD';
          const showCutLine = index === cutLineIndex;
          const roundScores = [entry.round_1, entry.round_2, entry.round_3, entry.round_4];

          return (
            <motion.div key={entry.id} custom={index} variants={rowVariants} initial="hidden" animate="visible">
              <Link
                {...playerRoute(entry.player?.id ?? '', tournamentName ? { kind: 'tournament', tournamentName } : undefined)}
                onClick={onPlayerTap}
                aria-label={`Position ${entry.position_tied ? `T${entry.position}` : entry.position}, ${entry.player?.full_name || 'Unknown'}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '3px',
                  padding: '13px 16px',
                  borderBottom: `0.5px solid ${INK_TINT_07}`,
                  borderLeft: entry.position === 1 && !isMissedCut && !isWD ? `3px solid ${AMBER}` : '3px solid transparent',
                  background: entry.position === 1 && !isMissedCut && !isWD ? AMBER_SOFT_BG : 'transparent',
                  opacity: isWD ? 0.4 : isMissedCut ? 0.55 : 1,
                  textDecoration: 'none',
                }}
                className="active:bg-black/[0.02] transition-colors"
              >
                {/* Position */}
                <span style={{ width: '24px', fontSize: '11px', fontWeight: 800, color: entry.position === 1 ? GOLD_DEEP : INK, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {isMissedCut ? 'MC' : isWD ? 'WD' : entry.position_tied ? `T${entry.position}` : String(entry.position)}
                </span>

                <div className="shrink-0 flex items-center justify-center" style={{ marginRight: '7px', width: '20px' }}>
                  <CountryFlag country={entry.player?.country} size="sm" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: INK, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, letterSpacing: '-0.015em' }}>
                    {abbrevName(entry.player?.full_name || 'Unknown')}
                  </p>
                </div>

                {roundScores.map((score, ri) => {
                  const isActive = sortRound === ri + 1;
                  const display = score == null ? '–' : score === 0 ? 'E' : String(score);
                  return (
                    <span key={ri} style={{ width: '21px', textAlign: 'center' as const, fontSize: '11px', fontWeight: isActive && score != null ? 700 : 400, color: isActive && score != null ? INK : INK_MUTE, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {display}
                    </span>
                  );
                })}

                <div style={{ width: '40px', textAlign: 'center' as const, flexShrink: 0 }}>
                  <ScoreToPar score={entry.score} emphasis size={15} />
                </div>

                <div style={{ width: '48px', textAlign: 'center' as const, flexShrink: 0 }}>
                  {(() => {
                    const finishedPill = <span style={{ fontSize: '9.5px', fontWeight: 700, color: INK, background: INK_TINT_05, padding: '2px 5px', borderRadius: 5 }}>F</span>;
                    if (isLive) {
                      const display = formatThruDisplay(entry.thru, entry.round_1, entry.round_2, entry.round_3, entry.round_4, entry.status, entry.thru_updated_at, tournamentTimezone);
                      if (!display) return <span style={{ fontSize: '9.5px', color: INK }}>—</span>;
                      if (['MC', 'WD', 'DQ', 'MDF', 'DNS'].includes(display)) return <span style={{ fontSize: '9.5px', color: INK, fontWeight: 600 }}>{display}</span>;
                      if (display === 'F') return finishedPill;
                      return <span style={{ fontSize: '9.5px', color: INK, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>Thru {display}</span>;
                    }
                    if (isMissedCut) return <span style={{ fontSize: '9.5px', color: INK, fontWeight: 600 }}>MC</span>;
                    if (isWD) return <span style={{ fontSize: '9.5px', color: INK, fontWeight: 600 }}>WD</span>;
                    if (entry.strokes) return finishedPill;
                    return <span style={{ fontSize: '9.5px', color: INK }}>—</span>;
                  })()}
                </div>
              </Link>

              {showCutLine && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 20px', background: INK_TINT_02, borderBottom: `0.5px solid ${INK_TINT_07}` }}>
                  <div style={{ flex: 1, height: '0.5px', background: HAIRLINE_INK_12 }} />
                  <span style={{ fontSize: '9px', fontWeight: 800, color: INK, letterSpacing: '0.14em' }}>MISSED CUT</span>
                  <div style={{ flex: 1, height: '0.5px', background: HAIRLINE_INK_12 }} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Results count */}
      <div style={{ padding: '10px 20px', textAlign: 'center' as const }}>
        <span style={{ fontSize: '10px', color: INK }}>
          {sortedEntries.length} player{sortedEntries.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
      </div>
    </motion.div>
  );
}
