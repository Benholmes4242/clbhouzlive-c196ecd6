/**
 * SummaryTab - Dispatch post-tournament summary
 */

import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BatchPlayerAvatar } from '../PlayerAvatar';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import { useTournamentScoringStats } from '../../hooks/useTourHubData';
import { playerRoute } from '../../routes';

interface SummaryTabProps {
  tournamentId: string;
  tournamentSrId: string | null;
  tournamentName?: string;
  isLive: boolean;
  isCompleted: boolean;
  leaderboard: any[] | null;
  headshotMap?: Map<string, string>;
}

function SummarySkeleton() {
  return (
    <div>
      {/* Champion block skeleton */}
      <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px', padding: '14px 20px 14px' }}>
        <div className="animate-pulse" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: '8px', width: '100px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px', marginBottom: '8px' }} />
            <div style={{ height: '22px', width: '160px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px', marginBottom: '6px' }} />
            <div style={{ height: '10px', width: '120px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
          </div>
          <div style={{ width: '52px', height: '52px', borderRadius: '34%', background: 'rgba(15,23,42,0.06)' }} />
          <div style={{ width: '60px' }}>
            <div style={{ height: '32px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px', marginBottom: '4px' }} />
            <div style={{ height: '8px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
      {/* Row skeletons */}
      <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: i < 3 ? '0.5px solid rgba(15,23,42,0.07)' : 'none', gap: '12px' }}>
            <div style={{ width: '36px', height: '14px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
            <div style={{ width: '28px', height: '28px', borderRadius: '34%', background: 'rgba(15,23,42,0.06)' }} />
            <div style={{ flex: 1, height: '13px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
            <div style={{ width: '44px', height: '13px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
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
        <Trophy className="w-12 h-12 mx-auto text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Summary Coming Soon</h3>
        <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
          Tournament summary will be available after completion.
        </p>
      </div>
    </motion.div>
  );
}

const sectionEntrance = {
  initial: { opacity: 0, y: 10 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.4 },
};

function formatEarnings(money: number): string {
  if (money >= 1_000_000) return `$${(money / 1_000_000).toFixed(2)}M`;
  return `$${Number(money).toLocaleString()}`;
}

function WinnerCard({ winner, runnerUp, headshotMap }: { winner: any; runnerUp: any | null; headshotMap?: Map<string, string> }) {
  const earnings = winner.money ? formatEarnings(winner.money) : null;
  const scoreToPar = winner.score !== null ? (winner.score === 0 ? 'E' : winner.score < 0 ? String(winner.score) : `+${winner.score}`) : '—';
  const marginOfVictory = runnerUp ? Math.abs((runnerUp.score ?? 0) - (winner.score ?? 0)) : null;

  return (
    <motion.div style={{ marginTop: '8px' }} {...sectionEntrance}>
      {/* Rule marker */}
      <div style={{ padding: '14px 20px 0', background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: '10px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Tournament Champion</span>
        </div>
      </div>

      {/* Winner hero row */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
        <Link to={`/tourhub/player/${winner.player?.id}`} style={{ display: 'block', textDecoration: 'none' }} className="active:opacity-80 transition-opacity">
          <div style={{ padding: '12px 20px 14px', borderLeft: '3px solid #F7931E', background: 'rgba(247,147,30,0.025)', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Winner</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {winner.player?.full_name ?? 'Unknown'}
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                  {marginOfVictory !== null && marginOfVictory > 0 && <span style={{ fontSize: '11px', color: '#64748B' }}>Won by {marginOfVictory} stroke{marginOfVictory !== 1 ? 's' : ''}</span>}
                  {earnings && <span style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A' }}>{earnings}</span>}
                </div>
              </div>

              {/* Squircle headshot */}
              <div style={{ width: '50px', height: '50px', borderRadius: '34%', overflow: 'hidden', flexShrink: 0, background: 'rgba(15,23,42,0.06)' }}>
                <BatchPlayerAvatar playerId={winner.player?.id || ''} playerName={winner.player?.full_name || ''} size="md" />
              </div>

              <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#F7931E', letterSpacing: '-0.05em', lineHeight: 1 }}>{scoreToPar}</div>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', letterSpacing: '0.08em' }}>TO PAR</div>
              </div>
            </div>
          </div>
        </Link>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Winner card */}
      {isCompleted && winner && (
        <WinnerCard winner={winner} runnerUp={runnerUp} headshotMap={headshotMap} />
      )}

      {/* Round-by-round scoring */}
      {scoringStats && scoringStats.rounds.length > 0 && (
        <motion.div style={{ marginTop: '8px' }} {...sectionEntrance}>
          <div style={{ padding: '14px 20px 0', background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1 }} />
              <span style={{ fontSize: '10px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Round Scoring</span>
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '5px 20px', background: 'rgba(15,23,42,0.02)', borderBottom: '0.5px solid rgba(15,23,42,0.07)', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
            {['ROUND', 'LOW', 'AVG', 'BIRDIES', 'BOGEYS'].map((h, i) => (
              <span key={h} style={{ fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flex: i === 0 ? '0 0 52px' : '1', textAlign: i > 0 ? 'center' as const : 'left' as const }}>{h}</span>
            ))}
          </div>

          <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
            {scoringStats.rounds.map((round: any) => (
              <div key={round.round} style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: '0.5px solid rgba(15,23,42,0.07)', fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', flex: '0 0 52px' }}>R{round.round}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#F7931E', flex: 1, textAlign: 'center' as const }}>{round.lowScore}</span>
                <span style={{ fontSize: '14px', color: '#64748B', flex: 1, textAlign: 'center' as const }}>{round.avgScore.toFixed(1)}</span>
                <span style={{ fontSize: '14px', color: '#16A34A', fontWeight: 600, flex: 1, textAlign: 'center' as const }}>{round.totalBirdies}</span>
                <span style={{ fontSize: '14px', color: '#DC2626', fontWeight: 600, flex: 1, textAlign: 'center' as const }}>{round.totalBogeys}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Field statistics */}
      {scoringStats && (() => {
        const t = scoringStats.totals;
        const total = t.eagles + t.birdies + t.pars + t.bogeys + t.doubleBogeys;
        if (total === 0) return null;

        const segments = [
          { label: 'Eagles', count: t.eagles, color: '#F7931E', pct: (t.eagles / total * 100).toFixed(1) },
          { label: 'Birdies', count: t.birdies, color: '#16A34A', pct: (t.birdies / total * 100).toFixed(1) },
          { label: 'Pars', count: t.pars, color: 'rgba(15,23,42,0.15)', pct: (t.pars / total * 100).toFixed(1) },
          { label: 'Bogeys', count: t.bogeys, color: '#DC2626', pct: (t.bogeys / total * 100).toFixed(1) },
          { label: 'Double+', count: t.doubleBogeys, color: '#7F1D1D', pct: (t.doubleBogeys / total * 100).toFixed(1) },
        ];

        return (
          <motion.div style={{ marginTop: '8px' }} {...sectionEntrance}>
            <div style={{ padding: '14px 20px 0', background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1 }} />
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Field Statistics</span>
              </div>
            </div>
            <div style={{ background: '#ffffff', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', padding: '12px 20px 16px' }}>
              <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                {segments.filter(s => s.count > 0).map((seg, i) => (
                  <div key={i} style={{ width: `${(seg.count / total) * 100}%`, background: seg.color }} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', textAlign: 'center' as const }}>
                {segments.map((seg) => (
                  <div key={seg.label}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{seg.count}</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#CBD5E1', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{seg.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* Final Top 10 */}
      {isCompleted && top10.length > 0 && (
        <motion.div style={{ marginTop: '8px' }} {...sectionEntrance}>
          <div style={{ padding: '14px 20px 0', background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1 }} />
              <span style={{ fontSize: '10px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Top Finishers</span>
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '5px 20px', background: 'rgba(15,23,42,0.02)', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
            <span style={{ width: '36px', fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>POS</span>
            <span style={{ flex: 1, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>PLAYER</span>
            <span style={{ width: '44px', textAlign: 'right' as const, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>SCORE</span>
          </div>

          <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
            {top10.map((entry: any, idx: number) => {
              const isWinner = entry.position === 1;
              const scoreToPar = entry.score !== null ? (entry.score === 0 ? 'E' : entry.score < 0 ? String(entry.score) : `+${entry.score}`) : '—';
              const scoreColor = entry.score !== null && entry.score < 0 ? '#F7931E' : entry.score !== null && entry.score > 0 ? '#EF4444' : '#94A3B8';

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.03, duration: 0.25 }}
                >
                  <Link
                    to={`/tourhub/player/${entry.player?.id}`}
                    style={{
                      display: 'flex', alignItems: 'center',
                      padding: '10px 20px',
                      borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                      borderLeft: isWinner ? '3px solid #F7931E' : '3px solid transparent',
                      background: isWinner ? 'rgba(247,147,30,0.025)' : 'transparent',
                      textDecoration: 'none',
                    }}
                    className="active:bg-black/[0.02] transition-colors"
                  >
                    <span style={{ width: '36px', fontSize: '14px', fontWeight: 900, color: isWinner ? '#F7931E' : '#94A3B8', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {entry.position_tied ? `T${entry.position}` : entry.position}
                    </span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <BatchPlayerAvatar playerId={entry.player?.id || ''} playerName={entry.player?.full_name || 'Unknown'} size="sm" />
                      <span style={{ fontSize: '14px', fontWeight: isWinner ? 800 : 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {entry.player?.full_name || 'Unknown'}
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: scoreColor, fontVariantNumeric: 'tabular-nums', width: '44px', textAlign: 'right' as const, flexShrink: 0 }}>
                      {scoreToPar}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Live round summary */}
      {isLive && !isCompleted && scoringStats && scoringStats.rounds.length > 0 && (() => {
        const latestRound = scoringStats.rounds[scoringStats.rounds.length - 1];
        return (
          <motion.div style={{ marginTop: '8px' }} {...sectionEntrance}>
            <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
              <div style={{ padding: '14px 20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', fontWeight: 900, color: '#22C55E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Live Round Summary</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center' as const, padding: '0 20px 14px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', marginBottom: '3px' }}>LOW ROUND</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{latestRound.lowScore}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', marginBottom: '3px' }}>SCORING AVG</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{latestRound.avgScore.toFixed(1)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', marginBottom: '3px' }}>FIELD</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{latestRound.playerCount}</div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })()}
    </motion.div>
  );
}
