/**
 * SummaryTab - Dispatch post-tournament summary
 */

import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BatchPlayerAvatar } from '../PlayerAvatar';
import { EditorialEmpty } from './EditorialEmpty';
import { useTournamentScoringStats } from '../../hooks/useTourHubData';
import { playerRoute } from '../../routes';
import { AMBER, INK, INK_FAINT, INK_MUTE, INK_TINT_02, INK_TINT_06, INK_TINT_07, LIVE_DOT, LIVE_INK, SCORE_OVER_PAR_LIGHT, SLATE_50, SURFACE, TREND_DOWN, TREND_UP } from '../../_shared/tokens';

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
      <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: '8px', padding: '14px 20px 14px' }}>
        <div className="animate-pulse" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: '8px', width: '100px', background: INK_TINT_06, borderRadius: '4px', marginBottom: '8px' }} />
            <div style={{ height: '22px', width: '160px', background: INK_TINT_06, borderRadius: '4px', marginBottom: '6px' }} />
            <div style={{ height: '10px', width: '120px', background: INK_TINT_06, borderRadius: '4px' }} />
          </div>
          <div style={{ width: '52px', height: '52px', borderRadius: '34%', background: INK_TINT_06 }} />
          <div style={{ width: '60px' }}>
            <div style={{ height: '32px', background: INK_TINT_06, borderRadius: '4px', marginBottom: '4px' }} />
            <div style={{ height: '8px', background: INK_TINT_06, borderRadius: '4px' }} />
          </div>
        </div>
      </div>
      {/* Row skeletons */}
      <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: '8px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: i < 3 ? `0.5px solid ${INK_TINT_07}` : 'none', gap: '12px' }}>
            <div style={{ width: '36px', height: '14px', background: INK_TINT_06, borderRadius: '4px' }} />
            <div style={{ width: '28px', height: '28px', borderRadius: '34%', background: INK_TINT_06 }} />
            <div style={{ flex: 1, height: '13px', background: INK_TINT_06, borderRadius: '4px' }} />
            <div style={{ width: '44px', height: '13px', background: INK_TINT_06, borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
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

function WinnerCard({ winner, runnerUp, headshotMap, tournamentName }: { winner: any; runnerUp: any | null; headshotMap?: Map<string, string>; tournamentName?: string }) {
  const earnings = winner.money ? formatEarnings(winner.money) : null;
  const scoreToPar = winner.score !== null ? (winner.score === 0 ? 'E' : winner.score < 0 ? String(winner.score) : `+${winner.score}`) : '—';
  const marginOfVictory = runnerUp ? Math.abs((runnerUp.score ?? 0) - (winner.score ?? 0)) : null;

  return (
    <motion.div style={{ marginTop: '8px' }} {...sectionEntrance}>
      {/* Section eyebrow */}
      <div style={{ padding: '14px 20px 12px', background: SLATE_50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Tournament Champion</span>
        </div>
      </div>

      {/* Winner hero row */}
      <div style={{ background: SURFACE, borderBottom: `1px solid ${INK_TINT_07}` }}>
        <Link {...playerRoute(winner.player?.id ?? '', tournamentName ? { kind: 'tournament', tournamentName } : undefined)} style={{ display: 'block', textDecoration: 'none' }} className="active:opacity-80 transition-opacity">
          <div style={{ padding: '12px 20px 14px', borderLeft: `3px solid ${AMBER}`, background: 'rgba(247,147,30,0.025)', borderTop: `0.5px solid ${INK_TINT_07}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: AMBER, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Winner</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: INK, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {winner.player?.full_name ?? 'Unknown'}
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                  {marginOfVictory !== null && marginOfVictory > 0 && <span style={{ fontSize: '11px', color: INK_MUTE }}>Won by {marginOfVictory} stroke{marginOfVictory !== 1 ? 's' : ''}</span>}
                  {earnings && <span style={{ fontSize: '11px', fontWeight: 700, color: TREND_UP }}>{earnings}</span>}
                </div>
              </div>

              {/* Squircle headshot */}
              <div style={{ width: '50px', height: '50px', borderRadius: '34%', overflow: 'hidden', flexShrink: 0, background: INK_TINT_06 }}>
                <BatchPlayerAvatar playerId={winner.player?.id || ''} playerName={winner.player?.full_name || ''} size="md" />
              </div>

              <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: AMBER, letterSpacing: '-0.05em', lineHeight: 1 }}>{scoreToPar}</div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: INK_FAINT, letterSpacing: '0.14em' }}>TO PAR</div>
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
  tournamentName,
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


  if (!isLive && !isCompleted)
    return (
      <EditorialEmpty
        icon={<Trophy size={28} strokeWidth={1.8} color={AMBER} />}
        eyebrow="Summary"
        title="Summary arrives after the final putt"
        body="Once the tournament wraps, you'll get the winner, the runner-up, margin of victory, and earnings — the whole story in one place."
      />
    );
  if (isLoading) return <SummarySkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Winner card */}
      {isCompleted && winner && (
        <WinnerCard winner={winner} runnerUp={runnerUp} headshotMap={headshotMap} tournamentName={tournamentName} />
      )}

      {/* Round-by-round scoring */}
      {scoringStats && scoringStats.rounds.length > 0 && (
        <motion.div style={{ marginTop: '8px' }} {...sectionEntrance}>
          <div style={{ padding: '14px 20px 12px', background: SLATE_50 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Round Scoring</span>
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '5px 20px', background: INK_TINT_02, borderBottom: `0.5px solid ${INK_TINT_07}`, borderTop: `0.5px solid ${INK_TINT_07}` }}>
            {['ROUND', 'LOW', 'AVG', 'BIRDIES', 'BOGEYS'].map((h, i) => (
              <span key={h} style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', flex: i === 0 ? '0 0 52px' : '1', textAlign: i > 0 ? 'center' as const : 'left' as const }}>{h}</span>
            ))}
          </div>

          <div style={{ background: SURFACE, borderBottom: `1px solid ${INK_TINT_07}` }}>
            {scoringStats.rounds.map((round: any) => (
              <div key={round.round} style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: `0.5px solid ${INK_TINT_07}`, fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: INK, flex: '0 0 52px' }}>R{round.round}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: SCORE_OVER_PAR_LIGHT, flex: 1, textAlign: 'center' as const }}>{round.lowScore}</span>
                <span style={{
                  fontSize: '14px', fontWeight: 600, flex: 1, textAlign: 'center' as const,
                  color: round.avgScore < 0 ? SCORE_OVER_PAR_LIGHT : round.avgScore > 0 ? INK : INK_MUTE,
                }}>{round.avgScore > 0 ? `+${round.avgScore.toFixed(1)}` : round.avgScore.toFixed(1)}</span>
                <span style={{ fontSize: '14px', color: SCORE_OVER_PAR_LIGHT, fontWeight: 600, flex: 1, textAlign: 'center' as const }}>{round.totalBirdies}</span>
                <span style={{ fontSize: '14px', color: INK, fontWeight: 600, flex: 1, textAlign: 'center' as const }}>{round.totalBogeys}</span>
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
          { label: 'Eagles', count: t.eagles, color: SCORE_OVER_PAR_LIGHT, pct: (t.eagles / total * 100).toFixed(1) },
          { label: 'Birdies', count: t.birdies, color: SCORE_OVER_PAR_LIGHT, pct: (t.birdies / total * 100).toFixed(1) },
          { label: 'Pars', count: t.pars, color: '#94A3B8', pct: (t.pars / total * 100).toFixed(1) },
          { label: 'Bogeys', count: t.bogeys, color: INK, pct: (t.bogeys / total * 100).toFixed(1) },
          { label: 'Double+', count: t.doubleBogeys, color: INK_MUTE, pct: (t.doubleBogeys / total * 100).toFixed(1) },
        ];

        return (
          <motion.div style={{ marginTop: '8px' }} {...sectionEntrance}>
            <div style={{ padding: '14px 20px 12px', background: SLATE_50 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Field Statistics</span>
              </div>
            </div>
            <div style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, padding: '12px 20px 16px' }}>
              <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                {segments.filter(s => s.count > 0).map((seg, i) => (
                  <div key={i} style={{ width: `${(seg.count / total) * 100}%`, background: seg.color }} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', textAlign: 'center' as const }}>
                {segments.map((seg) => (
                  <div key={seg.label}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums' }}>{seg.count}</div>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>{seg.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* Final Top 10 */}
      {isCompleted && (() => {
        let best: { name: string; playerId: string; round: number; score: number } | null = null;
        for (const e of (leaderboard ?? [])) {
          for (const r of [1, 2, 3, 4] as const) {
            const s = (e as any)[`round_${r}`] as number | null;
            if (s == null) continue;
            if (!best || s < best.score) {
              best = { name: e.player?.full_name ?? 'Unknown', playerId: e.player?.id ?? '', round: r, score: s };
            }
          }
        }
        if (!best) return null;
        const scoreStr = best.score === 0 ? 'E' : best.score < 0 ? String(best.score) : `+${best.score}`;
        return (
          <motion.div style={{ marginTop: '8px' }} {...sectionEntrance}>
            <div style={{ padding: '14px 20px 12px', background: SLATE_50 }}>
              <div>
                <span style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Best Round of the Week</span>
              </div>
            </div>
            <Link
              {...playerRoute(best.playerId, tournamentName ? { kind: 'tournament', tournamentName } : undefined)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px 16px', background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, textDecoration: 'none' }}
              className="active:bg-black/[0.02] transition-colors"
            >
              <BatchPlayerAvatar playerId={best.playerId} playerName={best.name} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{best.name}</div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: INK_MUTE, marginTop: '2px' }}>Round {best.round}</div>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 900, color: SCORE_OVER_PAR_LIGHT, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{scoreStr}</span>
            </Link>
          </motion.div>
        );
      })()}

      {/* Live round summary */}
      {isLive && !isCompleted && scoringStats && scoringStats.rounds.length > 0 && (() => {
        const latestRound = scoringStats.rounds[scoringStats.rounds.length - 1];
        return (
          <motion.div style={{ marginTop: '8px' }} {...sectionEntrance}>
            <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}` }}>
              <div style={{ padding: '14px 20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: LIVE_DOT, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: '9px', fontWeight: 800, color: LIVE_INK, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Live Round Summary</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center' as const, padding: '0 20px 14px' }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', marginBottom: '3px' }}>LOW ROUND</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums' }}>{latestRound.lowScore}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', marginBottom: '3px' }}>SCORING AVG</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                    color: latestRound.avgScore < 0 ? SCORE_OVER_PAR_LIGHT : latestRound.avgScore > 0 ? INK : INK }}>
                    {latestRound.avgScore > 0 ? `+${latestRound.avgScore.toFixed(1)}` : latestRound.avgScore.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', marginBottom: '3px' }}>FIELD</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums' }}>{latestRound.playerCount}</div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })()}
    </motion.div>
  );
}
