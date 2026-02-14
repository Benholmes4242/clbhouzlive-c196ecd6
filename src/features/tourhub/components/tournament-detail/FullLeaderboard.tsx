/**
 * FullLeaderboard - Expanded tournament leaderboard with round scores
 * 
 * Features:
 * - Glassmorphic card container
 * - Column headers (POS, PLAYER, R1-R4, TOTAL, TO PAR)
 * - Round filter selector with spring animation
 * - Player search with glass input
 * - Cut line separator with accent styling
 * - MC/WD handling
 * - JetBrains Mono for scores
 * - Staggered row entrance animations
 * - Semantic token compliant
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
}

// Score display with PGA convention
function ScoreCell({ score, className }: { score: number | null; className?: string }) {
  if (score === null || score === undefined) {
    return <span className={cn("score-mono text-muted-foreground/50", className)}>—</span>;
  }
  return <span className={cn("score-mono font-medium", className)}>{score}</span>;
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
            ? TOUR_COLORS.scoreOverPar
            : TOUR_COLORS.scoreEven,
      }}
    >
      {formatted}
    </span>
  );
}

// Position badge with podium gradients
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
      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
      isTop3 ? podiumStyles[position] : "bg-muted text-muted-foreground"
    )}>
      {display}
    </div>
  );
}

// Stagger animation for rows
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
}: FullLeaderboardProps) {
  const [selectedRound, setSelectedRound] = useState('Overall');
  const [searchQuery, setSearchQuery] = useState('');

  // Determine available rounds
  const availableRounds = useMemo(() => {
    const rounds: string[] = ['Overall'];
    if (entries.some(e => e.round_1 != null)) rounds.push('R1');
    if (entries.some(e => e.round_2 != null)) rounds.push('R2');
    if (entries.some(e => e.round_3 != null)) rounds.push('R3');
    if (entries.some(e => e.round_4 != null)) rounds.push('R4');
    return rounds;
  }, [entries]);

  // Filter by search
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(e =>
      e.player?.full_name?.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  // Sort by selected round or overall position
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

  // Find cut line index (last non-MC player)
  const cutLineIndex = useMemo(() => {
    if (selectedRound !== 'Overall') return -1;
    let lastActiveIdx = -1;
    for (let i = 0; i < sortedEntries.length; i++) {
      const status = sortedEntries[i].status;
      if (status !== 'MC' && status !== 'CUT' && status !== 'WD') {
        lastActiveIdx = i;
      }
    }
    // Only show cut line if there are MC players after
    if (lastActiveIdx >= 0 && lastActiveIdx < sortedEntries.length - 1) {
      const nextStatus = sortedEntries[lastActiveIdx + 1]?.status;
      if (nextStatus === 'MC' || nextStatus === 'CUT') {
        return lastActiveIdx;
      }
    }
    return -1;
  }, [sortedEntries, selectedRound]);

  const showRoundColumns = selectedRound === 'Overall';

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Round selector */}
      {availableRounds.length > 1 && (
        <RoundSelector
          rounds={availableRounds}
          activeRound={selectedRound}
          onRoundChange={setSelectedRound}
        />
      )}

      {/* Search input — glassmorphic */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full pl-10 pr-10 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60",
            "bg-card/80 backdrop-blur-sm border border-border/50",
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
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Leaderboard table — glassmorphic container */}
      <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card/80 backdrop-blur-sm">
        {/* Column headers */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40 bg-muted/20">
          <div className="w-8 shrink-0 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Pos</span>
          </div>
          <div className="w-8 shrink-0" /> {/* Avatar space */}
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Player</span>
          </div>
          {showRoundColumns && (
            <>
              <div className="w-9 text-center hidden sm:block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">R1</span>
              </div>
              <div className="w-9 text-center hidden sm:block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">R2</span>
              </div>
              <div className="w-9 text-center hidden sm:block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">R3</span>
              </div>
              <div className="w-9 text-center hidden sm:block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">R4</span>
              </div>
              <div className="w-12 text-center hidden sm:block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Total</span>
              </div>
            </>
          )}
          <div className="w-12 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {selectedRound === 'Overall' ? 'To Par' : 'Score'}
            </span>
          </div>
          {/* Thru column for live */}
          {tournamentStatus === 'inprogress' && (
            <div className="w-10 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Thru</span>
            </div>
          )}
          <div className="w-4 shrink-0" /> {/* Chevron space */}
        </div>

        {/* Player rows */}
        <div className="divide-y divide-border/20">
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
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 transition-all duration-200",
                    "hover:bg-muted/40 active:scale-[0.995]",
                    isTop3 && "bg-amber-50/20 dark:bg-amber-900/5",
                    (isMissedCut || isWD) && "opacity-50",
                  )}
                >
                  {/* Position */}
                  <PositionBadge
                    position={entry.position}
                    tied={entry.position_tied}
                    isMissedCut={isMissedCut}
                    status={entry.status}
                  />

                  {/* Avatar */}
                  <div className="shrink-0">
                    <BatchPlayerAvatar
                      playerId={entry.player?.id || ''}
                      playerName={entry.player?.full_name || 'Unknown'}
                      fallbackPhotoUrl={entry.player?.photo_url}
                      headshotMap={headshotMap}
                      size="sm"
                    />
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-semibold truncate text-foreground text-sm",
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

                  {/* Round scores (overall mode) */}
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

                  {/* Score to Par / Round Score */}
                  <div className="w-12 text-center">
                    {selectedRound === 'Overall' ? (
                      <ScoreToPar score={entry.score} className="text-sm" />
                    ) : (
                      <ScoreCell score={roundScoreForSelected} className="text-sm font-semibold" />
                    )}
                  </div>

                  {/* Thru for live */}
                  {tournamentStatus === 'inprogress' && (
                    <div className="w-10 text-center">
                      {(() => {
                        const display = formatThruDisplay(
                          entry.thru, entry.round_1, entry.round_2, entry.round_3, entry.round_4,
                          entry.status, entry.thru_updated_at, tournamentTimezone
                        );
                        if (!display) return null;
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
                      })()}
                    </div>
                  )}

                  {/* Chevron */}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                </Link>

                {/* Cut line separator */}
                {showCutLine && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-destructive/5">
                    <div className="flex-1 border-t border-dashed border-destructive/30" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-destructive/60">
                      Projected Cut
                    </span>
                    <div className="flex-1 border-t border-dashed border-destructive/30" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Results count footer */}
        <div className="px-4 py-2.5 border-t border-border/30 bg-muted/10">
          <span className="text-[11px] text-muted-foreground/60">
            {sortedEntries.length} player{sortedEntries.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
