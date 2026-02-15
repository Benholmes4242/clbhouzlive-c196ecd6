/**
 * SummaryTab - Post-tournament summary (no card containers)
 */

import { useMemo } from 'react';
import { Trophy, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { BatchPlayerAvatar } from '../PlayerAvatar';
import { TOUR_COLORS } from '../../constants/colors';
import { useTournamentScoringStats } from '../../hooks/useTourHubData';

interface SummaryTabProps {
  tournamentId: string;
  tournamentSrId: string | null;
  isLive: boolean;
  isCompleted: boolean;
  leaderboard: any[] | null;
  headshotMap?: Map<string, string>;
}

function SummarySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-40 bg-muted rounded-2xl" />
      <div className="h-32 bg-muted rounded-2xl" />
      <div className="h-24 bg-muted rounded-2xl" />
    </div>
  );
}

function SummaryEmpty() {
  return (
    <motion.div
      className="flex items-center justify-center py-20"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center space-y-3">
        <Trophy className="w-12 h-12 mx-auto text-muted-foreground/30" />
        <h3 className="text-lg font-semibold text-foreground">Summary Coming Soon</h3>
        <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
          Tournament summary will be available after completion.
        </p>
      </div>
    </motion.div>
  );
}

function ScoreToPar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground/50">—</span>;
  const formatted = score === 0 ? 'E' : score > 0 ? `+${score}` : String(score);
  return (
    <span
      className="score-mono font-bold"
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

function WinnerCard({ winner, runnerUp, headshotMap }: {
  winner: any;
  runnerUp: any | null;
  headshotMap?: Map<string, string>;
}) {
  const marginOfVictory = runnerUp
    ? (runnerUp.score || 0) - (winner.score || 0)
    : null;

  const earnings = winner.money
    ? winner.money >= 1_000_000
      ? `$${(winner.money / 1_000_000).toFixed(2)}M`
      : `$${Number(winner.money).toLocaleString()}`
    : null;

  return (
    <motion.div
      className="py-6 border-t border-border"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-foreground">Champion</h3>
      </div>

      <div className="flex items-center gap-4">
        <Link to={`/tourhub/player/${winner.player?.id}`}>
          <BatchPlayerAvatar
            playerId={winner.player?.id || ''}
            playerName={winner.player?.full_name || 'Unknown'}
            fallbackPhotoUrl={winner.player?.photo_url}
            headshotMap={headshotMap}
            size="lg"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/tourhub/player/${winner.player?.id}`}>
            <h4 className="text-2xl font-bold text-foreground truncate hover:text-primary transition-colors">
              {winner.player?.full_name || 'Unknown'}
            </h4>
          </Link>
          {winner.player?.country && (
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              {winner.player.country}
            </p>
          )}
          <div className="flex items-baseline gap-3">
            <span className="score-mono text-3xl font-bold" style={{ color: TOUR_COLORS.scoreUnderPar }}>
              {winner.score === 0 ? 'E' : winner.score > 0 ? `+${winner.score}` : String(winner.score)}
            </span>
            <span className="score-mono text-sm text-muted-foreground">
              ({winner.strokes} strokes)
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border/30">
        {[winner.round_1, winner.round_2, winner.round_3, winner.round_4].some(Boolean) && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Rounds:</span>
            <span className="score-mono text-xs font-medium text-foreground">
              {[winner.round_1, winner.round_2, winner.round_3, winner.round_4]
                .filter(r => r != null)
                .join('-')}
            </span>
          </div>
        )}
        {marginOfVictory !== null && marginOfVictory > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Won by:</span>
            <span className="text-xs font-semibold text-foreground">
              {marginOfVictory} stroke{marginOfVictory !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        {earnings && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Earnings:</span>
            <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>{earnings}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function SummaryTab({
  tournamentId,
  isLive,
  isCompleted,
  leaderboard,
  headshotMap,
}: SummaryTabProps) {
  const { data: scoringStats, isLoading } = useTournamentScoringStats(tournamentId);

  const winner = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) return null;
    return leaderboard.find((e: any) => e.position === 1) || leaderboard[0];
  }, [leaderboard]);

  const runnerUp = useMemo(() => {
    if (!leaderboard || leaderboard.length < 2) return null;
    return leaderboard.find((e: any) => e.position === 2) || leaderboard[1];
  }, [leaderboard]);

  const top10 = useMemo(() => {
    if (!leaderboard) return [];
    return leaderboard.slice(0, 10);
  }, [leaderboard]);

  if (!isLive && !isCompleted) return <SummaryEmpty />;
  if (isLoading) return <SummarySkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Winner card */}
      {isCompleted && winner && (
        <WinnerCard winner={winner} runnerUp={runnerUp} headshotMap={headshotMap} />
      )}

      {/* Round-by-round scoring summary */}
      {scoringStats && scoringStats.rounds.length > 0 && (
        <motion.div
          className="py-6 border-t border-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Round-by-Round</h3>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-5 gap-2 py-2 border-b border-border">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">Round</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-center">Low</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-center">Avg</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-center">Birdies</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-center">Bogeys</span>
          </div>

          <div className="divide-y divide-border/30">
            {scoringStats.rounds.map(round => (
              <div key={round.round} className="grid grid-cols-5 gap-2 py-2.5 items-center">
                <span className="text-[13px] font-semibold text-foreground font-mono">R{round.round}</span>
                <span className="text-[13px] text-center font-mono font-medium text-foreground tabular-nums">{round.lowScore}</span>
                <span className="text-[13px] text-center font-mono text-muted-foreground tabular-nums">{round.avgScore.toFixed(1)}</span>
                <span className="text-[13px] text-center font-mono text-green-600 tabular-nums">{round.totalBirdies}</span>
                <span className="text-[13px] text-center font-mono text-orange-500 tabular-nums">{round.totalBogeys}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Field statistics */}
      {scoringStats && (
        <motion.div
          className="py-6 border-t border-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Field Statistics</h3>
          </div>

          {(() => {
            const t = scoringStats.totals;
            const total = t.eagles + t.birdies + t.pars + t.bogeys + t.doubleBogeys;
            if (total === 0) return null;

            const segments = [
              { label: 'Eagles', count: t.eagles, color: 'bg-amber-400', pct: (t.eagles / total * 100).toFixed(1) },
              { label: 'Birdies', count: t.birdies, color: 'bg-green-500', pct: (t.birdies / total * 100).toFixed(1) },
              { label: 'Pars', count: t.pars, color: 'bg-muted-foreground/30', pct: (t.pars / total * 100).toFixed(1) },
              { label: 'Bogeys', count: t.bogeys, color: 'bg-orange-400', pct: (t.bogeys / total * 100).toFixed(1) },
              { label: 'Double+', count: t.doubleBogeys, color: 'bg-destructive', pct: (t.doubleBogeys / total * 100).toFixed(1) },
            ];

            return (
              <div className="space-y-3">
                <div className="flex h-3 rounded-full overflow-hidden">
                  {segments.filter(s => s.count > 0).map((seg, i) => (
                    <div
                      key={i}
                      className={cn("transition-all", seg.color)}
                      style={{ width: `${(seg.count / total) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {segments.map((seg) => (
                    <div key={seg.label} className="text-center">
                      <div className="text-[13px] font-bold text-foreground font-mono tabular-nums">{seg.count}</div>
                      <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">{seg.label}</div>
                      <div className="text-[9px] text-muted-foreground/50 tabular-nums">{seg.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Final Top 10 */}
      {isCompleted && top10.length > 0 && (
        <motion.div
          className="py-6 border-t border-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-foreground">Final Top 10</h3>
          </div>

          <div className="divide-y divide-border/30">
            {top10.map((entry: any, idx: number) => {
              const isWinner = entry.position === 1;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.03, duration: 0.25 }}
                >
                  <Link
                    to={`/tourhub/player/${entry.player?.id}`}
                    className={cn(
                      "flex items-center gap-3 py-2.5 hover:bg-muted/40 rounded-lg px-1 transition-colors active:scale-[0.99]",
                      isWinner && "bg-amber-50/20"
                    )}
                  >
                    <span className={cn(
                      "w-7 text-center text-[12px] font-bold font-mono tabular-nums",
                      isWinner ? "text-amber-600" : "text-muted-foreground"
                    )}>
                      {entry.position_tied ? `T${entry.position}` : entry.position}
                    </span>
                    <BatchPlayerAvatar
                      playerId={entry.player?.id || ''}
                      playerName={entry.player?.full_name || 'Unknown'}
                      fallbackPhotoUrl={entry.player?.photo_url}
                      headshotMap={headshotMap}
                      size="sm"
                    />
                    <span className="flex-1 text-[14px] font-medium text-foreground truncate">
                      {entry.player?.full_name || 'Unknown'}
                    </span>
                    <ScoreToPar score={entry.score} />
                    {entry.money && entry.money > 0 && (
                      <span className="text-[10px] text-muted-foreground score-mono hidden sm:block">
                        ${(entry.money / 1000).toFixed(0)}K
                      </span>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Live round summary */}
      {isLive && !isCompleted && scoringStats && scoringStats.rounds.length > 0 && (
        <motion.div
          className="py-6 border-t border-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="flex items-center gap-1.5 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">Live Round Summary</h3>
          </div>
          {(() => {
            const latestRound = scoringStats.rounds[scoringStats.rounds.length - 1];
            return (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">Low Round</div>
                  <div className="text-[18px] font-bold text-foreground font-mono tabular-nums">{latestRound.lowScore}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">Scoring Avg</div>
                  <div className="text-[18px] font-bold text-foreground font-mono tabular-nums">{latestRound.avgScore.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">Field</div>
                  <div className="text-[18px] font-bold text-foreground font-mono tabular-nums">{latestRound.playerCount}</div>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </motion.div>
  );
}
