/**
 * FullLeaderboard - Expanded tournament leaderboard (no card container)
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BatchPlayerAvatar } from '../PlayerAvatar';
import { RoundSelector } from './RoundSelector';
import { TOUR_COLORS } from '../../constants/colors';
import { formatThruDisplay } from '../../utils/formatThruDisplay';

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
  player?: {
    id: string;
    full_name: string;
    photo_url?: string | null;
    country?: string | null;
    country_code?: string | null;
  };
}

interface FullLeaderboardProps {
  entries: FullLeaderboardEntry[];
  headshotMap?: Map<string, string>;
  tournamentStatus?: string;
  tournamentTimezone?: string | null;
  venuePar?: number | null;
  onPlayerTap?: () => void;
}

function ScoreCell({ score, className }: { score: number | null; className?: string }) {
  if (score === null || score === undefined) {
    return <span className={cn("score-mono text-muted-foreground/50", className)}>—</span>;
  }
  return <span className={cn("score-mono font-semibold text-foreground tabular-nums", className)}>{score}</span>;
}

function ScoreToPar({ score, className }: { score: number | null; className?: string }) {
  if (score === null) return <span className={cn("score-mono text-muted-foreground/50", className)}>—</span>;
  const formatted = score === 0 ? 'E' : score > 0 ? `+${score}` : String(score);
  return (
    <span
      className={cn("score-mono font-bold", className)}
      style={{
        color: score < 0
          ? TOUR_COLORS.scoreUnderPar
          : score > 0
          ? 'hsl(var(--foreground))'
            : 'hsl(var(--muted-foreground))',
      }}
    >
      {formatted}
    </span>
  );
}

function PositionBadge({ position, tied, isMissedCut, status }: {
  position: number;
  tied?: boolean;
  isMissedCut?: boolean;
  status?: string;
}) {
  const isTop3 = position <= 3 && !isMissedCut;
  const display = isMissedCut ? 'MC' : status === 'WD' ? 'WD' : tied ? `T${position}` : String(position);

  const podiumStyles: Record<number, string> = {
    1: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900 shadow-sm shadow-amber-500/20',
    2: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 shadow-sm shadow-slate-400/20',
    3: 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900 shadow-sm shadow-orange-500/20',
  };

  return (
    <div className={cn(
      "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
      isTop3 ? podiumStyles[position] : "bg-muted text-muted-foreground"
    )}>
      {display}
    </div>
  );
}

const rowVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      delay: Math.min(i * 0.02, 0.6),
      duration: 0.25,
    },
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
    if (entries.some(e => e.round_1 != null)) rounds.push('R1');
    if (entries.some(e => e.round_2 != null)) rounds.push('R2');
    if (entries.some(e => e.round_3 != null)) rounds.push('R3');
    if (entries.some(e => e.round_4 != null)) rounds.push('R4');
    return rounds;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(e =>
      e.player?.full_name?.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  const sortedEntries = useMemo(() => {
    if (selectedRound === 'Overall') return filteredEntries;

    const roundKey = `round_${selectedRound.replace('R', '')}` as keyof FullLeaderboardEntry;
    return [...filteredEntries].sort((a, b) => {
      const aVal = a[roundKey] as number | null;
      const bVal = b[roundKey] as number | null;
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return aVal - bVal;
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
      if (nextStatus === 'MC' || nextStatus === 'CUT') {
        return lastActiveIdx;
      }
    }
    return -1;
  }, [sortedEntries, selectedRound]);

  const showRoundColumns = selectedRound === 'Overall';
  const isLive = tournamentStatus === 'inprogress';

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Round selector - pill style */}
      {availableRounds.length > 1 && (
        <RoundSelector
          rounds={availableRounds}
          activeRound={selectedRound}
          onRoundChange={setSelectedRound}
        />
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground z-10" strokeWidth={2.5} />
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full h-12 pl-10 pr-10 rounded-2xl text-[14px] text-foreground placeholder:text-muted-foreground/50",
            "bg-muted/50 border border-border",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
            "transition-all duration-200"
          )}
        />
        <AnimatePresence>
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="w-8 shrink-0 text-center">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">Pos</span>
        </div>
        <div className="w-8 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">Player</span>
        </div>
        {showRoundColumns && (
          <>
            <div className="w-9 text-center hidden sm:block">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">R1</span>
            </div>
            <div className="w-9 text-center hidden sm:block">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">R2</span>
            </div>
            <div className="w-9 text-center hidden sm:block">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">R3</span>
            </div>
            <div className="w-9 text-center hidden sm:block">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">R4</span>
            </div>
            <div className="w-12 text-center hidden sm:block">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">Total</span>
            </div>
          </>
        )}
        <div className="w-12 text-center">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            {selectedRound === 'Overall' ? 'To Par' : 'Score'}
          </span>
        </div>
        <div className="w-10 text-center">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">Thru</span>
        </div>
        <div className="w-4 shrink-0" />
      </div>

      {/* Player rows */}
      <div className="divide-y divide-border/30">
        {sortedEntries.map((entry, index) => {
          const isMissedCut = entry.status === 'MC' || entry.status === 'CUT';
          const isWD = entry.status === 'WD';
          const isTop3 = entry.position <= 3 && !isMissedCut && !isWD;
          const showCutLine = index === cutLineIndex;

          const roundScoreForSelected = selectedRound !== 'Overall'
            ? (entry as any)[`round_${selectedRound.replace('R', '')}`] as number | null
            : null;

          return (
            <motion.div
              key={entry.id}
              custom={index}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
            >
              <Link
                to={`/tourhub/player/${entry.player?.id}`}
                onClick={onPlayerTap}
                aria-label={`Position ${entry.position_tied ? `T${entry.position}` : entry.position}, ${entry.player?.full_name || 'Unknown'}, ${entry.score === null ? 'no score' : entry.score === 0 ? 'even' : entry.score < 0 ? `${entry.score} to par` : `+${entry.score} to par`}, ${(() => {
                  if (isMissedCut) return 'missed cut';
                  if (isWD) return 'withdrawn';
                  if (entry.thru === null) return 'not started';
                  if (entry.thru === 18 || entry.strokes) return 'finished';
                  return `through hole ${entry.thru}`;
                })()}`}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 transition-all duration-200 min-h-[52px]",
                   "hover:bg-muted/40 active:scale-[0.995]",
                   entry.position === 1 && !isMissedCut && !isWD && "bg-amber-50/30 dark:bg-amber-900/10 border-l-[3px] border-l-amber-400",
                   isTop3 && entry.position !== 1 && "bg-amber-50/10 dark:bg-amber-900/5",
                  (isMissedCut || isWD) && "opacity-50",
                )}
              >
                <PositionBadge
                  position={entry.position}
                  tied={entry.position_tied}
                  isMissedCut={isMissedCut}
                  status={entry.status}
                />

                <div className="shrink-0">
                  <BatchPlayerAvatar
                    playerId={entry.player?.id || ''}
                    playerName={entry.player?.full_name || 'Unknown'}
                    size="sm"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-semibold truncate text-foreground text-[14px]",
                    isWD && "italic"
                  )}>
                    {entry.player?.full_name || 'Unknown'}
                  </p>
                  {entry.player?.country_code && (
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {entry.player.country_code}
                    </p>
                  )}
                </div>

                {showRoundColumns && (
                  <>
                    <div className="w-9 text-center hidden sm:block">
                      <ScoreCell score={entry.round_1 ?? null} className="text-xs" />
                    </div>
                    <div className="w-9 text-center hidden sm:block">
                      <ScoreCell score={entry.round_2 ?? null} className="text-xs" />
                    </div>
                    <div className="w-9 text-center hidden sm:block">
                      <ScoreCell score={entry.round_3 ?? null} className="text-xs" />
                    </div>
                    <div className="w-9 text-center hidden sm:block">
                      <ScoreCell score={entry.round_4 ?? null} className="text-xs" />
                    </div>
                    <div className="w-12 text-center hidden sm:block">
                      <ScoreCell score={entry.strokes ?? null} className="text-xs font-semibold" />
                    </div>
                  </>
                )}

                <div className="w-12 text-center">
                  {selectedRound === 'Overall' ? (
                    <ScoreToPar score={entry.score} className="text-sm" />
                  ) : (
                    <ScoreCell score={roundScoreForSelected} className="text-sm font-semibold" />
                  )}
                </div>

                {/* Thru - always shown */}
                <div className="w-10 text-center">
                  {(() => {
                    if (isLive) {
                      const display = formatThruDisplay(
                        entry.thru, entry.round_1, entry.round_2, entry.round_3, entry.round_4,
                        entry.status, entry.thru_updated_at, tournamentTimezone
                      );
                      if (!display) return <span className="text-[10px] text-muted-foreground">—</span>;
                      if (display === 'MC' || display === 'WD' || display === 'DQ' || display === 'MDF' || display === 'DNS') {
                        return <span className="text-[10px] text-muted-foreground font-medium">{display}</span>;
                      }
                      if (display === 'F') {
                        return <span className="text-[10px] text-emerald-600 font-medium">F</span>;
                      }
                      return (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                          {display}
                        </span>
                      );
                    }
                    // For completed/upcoming: show F if they have scores
                    if (entry.status === 'MC' || entry.status === 'CUT') {
                      return <span className="text-[10px] text-muted-foreground font-medium">MC</span>;
                    }
                    if (entry.status === 'WD') {
                      return <span className="text-[10px] text-muted-foreground font-medium">WD</span>;
                    }
                    if (entry.strokes) {
                      return <span className="text-[10px] text-emerald-600 font-medium">F</span>;
                    }
                    return <span className="text-[10px] text-muted-foreground">—</span>;
                  })()}
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
              </Link>

              {showCutLine && (
                <div className="flex items-center gap-3 px-4 py-2 bg-destructive/5">
                  <div className="flex-1 border-t border-dashed border-destructive/50" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-destructive/80">
                    Projected Cut
                  </span>
                  <div className="flex-1 border-t border-dashed border-destructive/50" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Results count */}
      <div className="py-4 border-t border-border/20 text-center">
        <span className="text-xs text-muted-foreground">
          {sortedEntries.length} player{sortedEntries.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
      </div>
    </motion.div>
  );
}
