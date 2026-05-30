/**
 * FullLeaderboard - Expanded dispatch tournament leaderboard
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BatchPlayerAvatar } from '../PlayerAvatar';
import { RoundSelector } from './RoundSelector';
import { formatThruDisplay } from '../../utils/formatThruDisplay';
import { playerRoute } from '../../routes';
import { AMBER, HAIRLINE_INK_12, INK, INK_FAINT, INK_LIGHT, INK_MUTE, INK_TINT_02, INK_TINT_05, INK_TINT_07, LEADER_GOLD_TINT_10, SCORE_OVER_PAR_LIGHT, SCORE_UNDER_PAR_LIGHT, SURFACE } from '../../_shared/tokens';

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
  if (!round || (round.thru === 0 && round.strokes === 0)) return null;
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
}

function ScoreToPar({ score, className, emphasis, size }: { score: number | null; className?: string; emphasis?: boolean; size?: number }) {
  if (score === null) return <span className={cn(className)} style={{ fontVariantNumeric: 'tabular-nums', color: INK_FAINT }}>—</span>;
  const formatted = score === 0 ? 'E' : score > 0 ? `+${score}` : String(score);
  const color = score < 0 ? SCORE_UNDER_PAR_LIGHT : score > 0 ? SCORE_OVER_PAR_LIGHT : INK_FAINT;
  return (
    <span className={cn(className)} style={{
      fontVariantNumeric: 'tabular-nums',
      color,
      fontWeight: emphasis ? 800 : 700,
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

function ScoreCell({ score, className }: { score: number | null; className?: string }) {
  if (score === null || score === undefined || score <= 0) {
    return <span className={cn("", className)} style={{ fontVariantNumeric: 'tabular-nums', color: INK_LIGHT }}>—</span>;
  }
  return <span className={cn("font-semibold", className)} style={{ fontVariantNumeric: 'tabular-nums', color: INK }}>{score}</span>;
}

function getThruAriaLabel(entry: FullLeaderboardEntry, isMissedCut: boolean, isWD: boolean, isLive: boolean): string {
  if (isMissedCut) return 'missed cut';
  if (isWD) return 'withdrawn';
  if (entry.thru === null) return 'not started';
  if (entry.thru >= 18 || entry.strokes) return 'finished';
  return `through hole ${entry.thru}`;
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
}: FullLeaderboardProps) {
  const [selectedRound, setSelectedRound] = useState('Overall');
  const [searchQuery, setSearchQuery] = useState('');

  const availableRounds = useMemo(() => {
    const rounds: string[] = ['Overall'];
    for (let r = 1; r <= 4; r++) {
      const roundKey = `round_${r}` as keyof FullLeaderboardEntry;
      const hasCompleted = entries.some(e => e[roundKey] != null);
      const hasLive = entries.some(e => {
        const live = getLiveRoundData(e, r);
        return live !== null && (live.thru ?? 0) > 0;
      });
      if (hasCompleted || hasLive) rounds.push(`R${r}`);
    }
    return rounds;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(e => e.player?.full_name?.toLowerCase().includes(q));
  }, [entries, searchQuery]);

  const sortedEntries = useMemo(() => {
    if (selectedRound === 'Overall') return filteredEntries;
    const roundNum = parseInt(selectedRound.replace('R', ''), 10);
    const roundKey = `round_${roundNum}` as keyof FullLeaderboardEntry;
    return [...filteredEntries].sort((a, b) => {
      const aCompleted = a[roundKey] as number | null;
      const bCompleted = b[roundKey] as number | null;
      if (aCompleted != null && bCompleted != null) return aCompleted - bCompleted;
      if (aCompleted != null) return -1;
      if (bCompleted != null) return 1;
      const aLive = getLiveRoundData(a, roundNum);
      const bLive = getLiveRoundData(b, roundNum);
      const aScore = aLive?.score ?? null;
      const bScore = bLive?.score ?? null;
      if (aScore === null && bScore === null) return 0;
      if (aScore === null) return 1;
      if (bScore === null) return -1;
      return aScore - bScore;
    });
  }, [filteredEntries, selectedRound]);

  const cutLineIndex = useMemo(() => {
    if (selectedRound !== 'Overall') return -1;
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
  }, [sortedEntries, selectedRound]);

  const showRoundColumns = selectedRound === 'Overall';
  const isLive = tournamentStatus === 'inprogress';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Round selector */}
      {availableRounds.length > 1 && (
        <div style={{ padding: '8px 20px' }}>
          <RoundSelector rounds={availableRounds} activeRound={selectedRound} onRoundChange={setSelectedRound} />
        </div>
      )}

      {/* Search input */}
      <div style={{ padding: '0 20px 8px', position: 'relative' }}>
        <Search className="absolute left-[32px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] z-10" style={{ color: INK_FAINT }} strokeWidth={2.5} />
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

      {/* Column headers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '5px 16px', background: INK_TINT_02, borderTop: `0.5px solid ${INK_TINT_07}`, borderBottom: `0.5px solid ${INK_TINT_07}` }}>
        <span style={{ width: '24px', fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', flexShrink: 0 }}>POS</span>
        <span style={{ flex: 1, fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em' }}>PLAYER</span>
        {showRoundColumns && (
          <>
            <span style={{ width: '19px', textAlign: 'center' as const, fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', flexShrink: 0 }}>R1</span>
            <span style={{ width: '19px', textAlign: 'center' as const, fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', flexShrink: 0 }}>R2</span>
            <span style={{ width: '19px', textAlign: 'center' as const, fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', flexShrink: 0 }}>R3</span>
            <span style={{ width: '19px', textAlign: 'center' as const, fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', flexShrink: 0 }}>R4</span>
          </>
        )}
        <span style={{ width: '34px', textAlign: 'center' as const, fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', flexShrink: 0 }}>
          {selectedRound === 'Overall' ? 'TOT' : 'SCORE'}
        </span>
        <span style={{ width: '30px', textAlign: 'center' as const, fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', flexShrink: 0 }}>THRU</span>
      </div>

      {/* Player rows */}
      <div style={{ background: SURFACE, borderBottom: `1px solid ${INK_TINT_07}` }}>
        {sortedEntries.map((entry, index) => {
          const isMissedCut = entry.status === 'MC' || entry.status === 'CUT';
          const isWD = entry.status === 'WD';
          const showCutLine = index === cutLineIndex;

          const isRoundView = selectedRound !== 'Overall';
          const roundNum = isRoundView ? parseInt(selectedRound.replace('R', ''), 10) : 0;
          const completedRoundScore = isRoundView ? ((entry as any)[`round_${roundNum}`] as number | null) : null;
          const liveRound = isRoundView ? getLiveRoundData(entry, roundNum) : null;
          const liveRoundScore = liveRound?.score ?? null;
          const liveRoundThru = liveRound?.thru ?? null;
          const displayPosition = isRoundView ? index + 1 : entry.position;

          // (Phase 1 cleanup: dead getRoundScoreColor helper removed.)

          return (
            <motion.div key={entry.id} custom={index} variants={rowVariants} initial="hidden" animate="visible">
              <Link
                {...playerRoute(entry.player?.id ?? '', tournamentName ? { kind: 'tournament', tournamentName } : undefined)}
                onClick={onPlayerTap}
                aria-label={`Position ${entry.position_tied ? `T${entry.position}` : entry.position}, ${entry.player?.full_name || 'Unknown'}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '3px',
                  padding: '9px 16px',
                  borderBottom: `0.5px solid ${INK_TINT_07}`,
                  borderLeft: entry.position === 1 && !isMissedCut && !isWD ? `3px solid ${AMBER}` : '3px solid transparent',
                  background: entry.position === 1 && !isMissedCut && !isWD ? LEADER_GOLD_TINT_10 : 'transparent',
                  opacity: isWD ? 0.4 : isMissedCut ? 0.55 : 1,
                  textDecoration: 'none',
                }}
                className="active:bg-black/[0.02] transition-colors"
              >
                {/* Position */}
                <span style={{ width: '24px', fontSize: '11px', fontWeight: 800, color: displayPosition === 1 ? AMBER : INK_FAINT, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {isMissedCut ? 'MC' : isWD ? 'WD' : (!isRoundView && entry.position_tied) ? `T${displayPosition}` : String(displayPosition)}
                </span>

                <div className="shrink-0" style={{ marginRight: '7px' }}>
                  <BatchPlayerAvatar playerId={entry.player?.id || ''} playerName={entry.player?.full_name || 'Unknown'} size="xs" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: INK, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, letterSpacing: '-0.015em' }}>
                    {abbrevName(entry.player?.full_name || 'Unknown')}
                  </p>
                </div>

                {showRoundColumns && (
                  <>
                    {[entry.round_1, entry.round_2, entry.round_3, entry.round_4].map((score, ri) => (
                      <span key={ri} style={{ width: '19px', textAlign: 'center' as const, fontSize: '11px', fontWeight: 500, color: score != null ? INK_FAINT : INK_LIGHT, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {score != null ? score : '—'}
                      </span>
                    ))}
                  </>
                )}

                <div style={{ width: '34px', textAlign: 'center' as const, flexShrink: 0 }}>
                  {selectedRound === 'Overall' ? (
                    <ScoreToPar score={entry.score} emphasis size={14} />
                  ) : completedRoundScore != null ? (
                    <ScoreCell score={completedRoundScore} className="text-sm" />
                  ) : liveRoundScore != null ? (
                    <ScoreToPar score={liveRoundScore} className="text-sm" />
                  ) : (
                    <span style={{ color: INK_LIGHT, fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>—</span>
                  )}
                </div>

                <div style={{ width: '30px', textAlign: 'center' as const, flexShrink: 0 }}>
                  {(() => {
                    const finishedPill = <span style={{ fontSize: '9.5px', fontWeight: 700, color: INK_MUTE, background: INK_TINT_05, padding: '2px 5px', borderRadius: 5 }}>F</span>;
                    if (isRoundView && liveRoundThru != null && liveRoundThru > 0) {
                      if (liveRoundThru >= 18) return finishedPill;
                      return <span style={{ fontSize: '9.5px', color: INK_FAINT, fontVariantNumeric: 'tabular-nums' }}>Thru {liveRoundThru}</span>;
                    }
                    if (isRoundView && completedRoundScore != null) {
                      return finishedPill;
                    }
                    if (isLive) {
                      const display = formatThruDisplay(entry.thru, entry.round_1, entry.round_2, entry.round_3, entry.round_4, entry.status, entry.thru_updated_at, tournamentTimezone);
                      if (!display) return <span style={{ fontSize: '9.5px', color: INK_FAINT }}>—</span>;
                      if (['MC', 'WD', 'DQ', 'MDF', 'DNS'].includes(display)) return <span style={{ fontSize: '9.5px', color: INK_FAINT, fontWeight: 600 }}>{display}</span>;
                      if (display === 'F') return finishedPill;
                      return <span style={{ fontSize: '9.5px', color: INK_FAINT, fontVariantNumeric: 'tabular-nums' }}>Thru {display}</span>;
                    }
                    if (isMissedCut) return <span style={{ fontSize: '9.5px', color: INK_FAINT, fontWeight: 600 }}>MC</span>;
                    if (isWD) return <span style={{ fontSize: '9.5px', color: INK_FAINT, fontWeight: 600 }}>WD</span>;
                    if (entry.strokes) return finishedPill;
                    return <span style={{ fontSize: '9.5px', color: INK_FAINT }}>—</span>;
                  })()}
                </div>
              </Link>

              {showCutLine && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 20px', background: INK_TINT_02, borderBottom: `0.5px solid ${INK_TINT_07}` }}>
                  <div style={{ flex: 1, height: '0.5px', background: HAIRLINE_INK_12 }} />
                  <span style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em' }}>MISSED CUT</span>
                  <div style={{ flex: 1, height: '0.5px', background: HAIRLINE_INK_12 }} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Results count */}
      <div style={{ padding: '10px 20px', textAlign: 'center' as const }}>
        <span style={{ fontSize: '10px', color: '#94A3B8' }}>
          {sortedEntries.length} player{sortedEntries.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
      </div>
    </motion.div>
  );
}
