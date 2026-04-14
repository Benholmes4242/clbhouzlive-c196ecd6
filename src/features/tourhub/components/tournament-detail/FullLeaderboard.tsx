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
  venuePar?: number | null;
  onPlayerTap?: () => void;
}

function ScoreToPar({ score, className }: { score: number | null; className?: string }) {
  if (score === null) return <span className={cn("", className)} style={{ fontVariantNumeric: 'tabular-nums', color: '#94A3B8' }}>—</span>;
  const formatted = score === 0 ? 'E' : score > 0 ? `+${score}` : String(score);
  return (
    <span className={cn("font-bold", className)} style={{ fontVariantNumeric: 'tabular-nums', color: score < 0 ? '#F7931E' : score > 0 ? '#EF4444' : '#94A3B8' }}>
      {formatted}
    </span>
  );
}

function ScoreCell({ score, className }: { score: number | null; className?: string }) {
  if (score === null || score === undefined || score <= 0) {
    return <span className={cn("", className)} style={{ fontVariantNumeric: 'tabular-nums', color: '#CBD5E1' }}>—</span>;
  }
  return <span className={cn("font-semibold", className)} style={{ fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>{score}</span>;
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
        <Search className="absolute left-[32px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] z-10" style={{ color: '#94A3B8' }} strokeWidth={2.5} />
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
      <div style={{ display: 'flex', alignItems: 'center', padding: '5px 20px', background: 'rgba(15,23,42,0.02)', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
        <span style={{ width: '34px', fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>POS</span>
        <span style={{ flex: 1, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>PLAYER</span>
        {showRoundColumns && (
          <>
            <span style={{ width: '26px', textAlign: 'center' as const, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>R1</span>
            <span style={{ width: '26px', textAlign: 'center' as const, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>R2</span>
            <span style={{ width: '26px', textAlign: 'center' as const, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>R3</span>
            <span style={{ width: '26px', textAlign: 'center' as const, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>R4</span>
          </>
        )}
        <span style={{ width: '44px', textAlign: 'right' as const, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>
          {selectedRound === 'Overall' ? 'TOT' : 'SCORE'}
        </span>
        <span style={{ width: '36px', textAlign: 'center' as const, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>THRU</span>
      </div>

      {/* Player rows */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
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

          // Round score color helper
          const getRoundScoreColor = (score: number | null) => {
            if (score === null) return '#CBD5E1';
            const par = venuePar ? Math.round(venuePar / 4) : 72; // rough per-round par
            // We have strokes, compare to ~72 (or just show raw)
            return '#64748B';
          };

          return (
            <motion.div key={entry.id} custom={index} variants={rowVariants} initial="hidden" animate="visible">
              <Link
                to={`/tourhub/player/${entry.player?.id}`}
                onClick={onPlayerTap}
                aria-label={`Position ${entry.position_tied ? `T${entry.position}` : entry.position}, ${entry.player?.full_name || 'Unknown'}`}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '9px 20px',
                  borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                  borderLeft: entry.position === 1 && !isMissedCut && !isWD ? '3px solid #F7931E' : '3px solid transparent',
                  background: entry.position === 1 && !isMissedCut && !isWD ? 'rgba(247,147,30,0.025)' : 'transparent',
                  opacity: isWD ? 0.4 : isMissedCut ? 0.55 : 1,
                  textDecoration: 'none',
                }}
                className="active:bg-black/[0.02] transition-colors"
              >
                {/* Position */}
                <span style={{ width: '34px', fontSize: '12px', fontWeight: 900, color: displayPosition === 1 ? '#F7931E' : '#94A3B8', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {isMissedCut ? 'MC' : isWD ? 'WD' : (!isRoundView && entry.position_tied) ? `T${displayPosition}` : String(displayPosition)}
                </span>

                <div className="shrink-0" style={{ marginRight: '8px' }}>
                  <BatchPlayerAvatar playerId={entry.player?.id || ''} playerName={entry.player?.full_name || 'Unknown'} size="sm" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, letterSpacing: '-0.2px' }}>
                    {entry.player?.full_name || 'Unknown'}
                  </p>
                </div>

                {showRoundColumns && (
                  <>
                    {[entry.round_1, entry.round_2, entry.round_3, entry.round_4].map((score, ri) => (
                      <span key={ri} style={{ width: '26px', textAlign: 'center' as const, fontSize: '12px', fontWeight: 600, color: '#64748B', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {score != null ? score : '—'}
                      </span>
                    ))}
                  </>
                )}

                <div style={{ width: '44px', textAlign: 'right' as const, flexShrink: 0 }}>
                  {selectedRound === 'Overall' ? (
                    <ScoreToPar score={entry.score} className="text-sm" />
                  ) : completedRoundScore != null ? (
                    <ScoreCell score={completedRoundScore} className="text-sm" />
                  ) : liveRoundScore != null ? (
                    <ScoreToPar score={liveRoundScore} className="text-sm" />
                  ) : (
                    <span style={{ color: '#CBD5E1', fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>—</span>
                  )}
                </div>

                <div style={{ width: '36px', textAlign: 'center' as const, flexShrink: 0 }}>
                  {(() => {
                    if (isRoundView && liveRoundThru != null && liveRoundThru > 0) {
                      if (liveRoundThru >= 18) return <span style={{ fontSize: '10px', fontWeight: 600, color: '#F7931E' }}>F</span>;
                      return <span style={{ fontSize: '10px', color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>Thru {liveRoundThru}</span>;
                    }
                    if (isRoundView && completedRoundScore != null) {
                      return <span style={{ fontSize: '10px', fontWeight: 600, color: '#F7931E' }}>F</span>;
                    }
                    if (isLive) {
                      const display = formatThruDisplay(entry.thru, entry.round_1, entry.round_2, entry.round_3, entry.round_4, entry.status, entry.thru_updated_at, tournamentTimezone);
                      if (!display) return <span style={{ fontSize: '10px', color: '#94A3B8' }}>—</span>;
                      if (['MC', 'WD', 'DQ', 'MDF', 'DNS'].includes(display)) return <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>{display}</span>;
                      if (display === 'F') return <span style={{ fontSize: '10px', fontWeight: 600, color: '#F7931E' }}>F</span>;
                      return <span style={{ fontSize: '10px', color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>Thru {display}</span>;
                    }
                    if (isMissedCut) return <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>MC</span>;
                    if (isWD) return <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>WD</span>;
                    if (entry.strokes) return <span style={{ fontSize: '10px', fontWeight: 600, color: '#F7931E' }}>F</span>;
                    return <span style={{ fontSize: '10px', color: '#94A3B8' }}>—</span>;
                  })()}
                </div>
              </Link>

              {showCutLine && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 20px', background: 'rgba(15,23,42,0.02)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
                  <div style={{ flex: 1, height: '0.5px', background: 'rgba(15,23,42,0.12)' }} />
                  <span style={{ fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em' }}>MISSED CUT</span>
                  <div style={{ flex: 1, height: '0.5px', background: 'rgba(15,23,42,0.12)' }} />
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
