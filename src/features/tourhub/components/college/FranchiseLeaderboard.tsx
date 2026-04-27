/**
 * FranchiseLeaderboard — Phase 1 polish
 *  - Shared <SectionHeader> reused (eyebrow-only mode).
 *  - Captain anchors fed into each row from useFranchiseCaptains.
 *  - earningsRankChange piped from useTopMovers per-row.
 *  - Column header WIN/T10/EARNINGS labels retained.
 *  - Sub-eyebrow rendered when leader tied at #1.
 */

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { useTopMovers } from '../../hooks/useCollegeStatus';
import { useBatchCollegeAlumni } from '../../hooks/useBatchCollegeAlumni';
import { useFranchiseCaptains } from '../../hooks/useFranchiseCaptains';
import { SectionHeader } from '../shared/SectionHeader';
import { FranchiseCard } from './FranchiseCard';
import { FranchiseMovers } from './FranchiseMovers';

type MetricTab = 'earnings' | 'wins' | 'top10s' | 'movers';

const VALID_METRICS = new Set<string>(['earnings', 'wins', 'top10s', 'movers']);

interface FranchiseLeaderboardProps {
  limit?: number;
  className?: string;
  activeMetric?: MetricTab;
  onMetricChange?: (metric: MetricTab) => void;
  hideHeader?: boolean;
}

const SECTION_EYEBROW: Record<Exclude<MetricTab, 'movers'>, string> = {
  earnings: 'Season Earnings Leaderboard',
  wins: 'Season Wins Leaderboard',
  top10s: 'Top 10s Leaderboard',
};

export function FranchiseLeaderboard({
  limit = 25,
  className,
  activeMetric: externalMetric,
  onMetricChange: _onMetricChange,
  hideHeader: _hideHeader = false,
}: FranchiseLeaderboardProps) {
  const [searchParams] = useSearchParams();
  const sortParam = searchParams.get('sort') || 'earnings';
  const internalMetric: MetricTab = VALID_METRICS.has(sortParam) ? (sortParam as MetricTab) : 'earnings';
  const activeMetric = externalMetric ?? internalMetric;

  const { data: allStats, isLoading } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();
  const { data: moverInfo } = useTopMovers();

  const { sortedStats, isTiedAtOne } = useMemo(() => {
    if (!allStats) return { sortedStats: [] as CollegeSeasonStats[], isTiedAtOne: false };
    const getValue = (s: CollegeSeasonStats) => {
      switch (activeMetric) {
        case 'wins': return s.wins_total;
        case 'top10s': return s.top10_total;
        default: return s.earnings_total;
      }
    };
    const sorted = [...allStats]
      .sort((a, b) => {
        const diff = getValue(b) - getValue(a);
        if (diff !== 0) return diff;
        if (activeMetric === 'wins' || activeMetric === 'top10s') return b.earnings_total - a.earnings_total;
        return b.wins_total - a.wins_total;
      })
      .filter(s => (activeMetric === 'wins' || activeMetric === 'top10s') ? getValue(s) > 0 : true)
      .slice(0, limit);
    const tied = sorted.length >= 2 && getValue(sorted[0]) === getValue(sorted[1]);
    return { sortedStats: sorted, isTiedAtOne: tied };
  }, [allStats, activeMetric, limit]);

  const collegeSlugs = useMemo(() => sortedStats.map(s => s.normalized_name), [sortedStats]);
  const { data: alumniMap } = useBatchCollegeAlumni(collegeSlugs, 3);
  const { data: captainMap } = useFranchiseCaptains(collegeSlugs);

  // Tie-breaker copy. Surfaced in audit decision #2: order is metric-secondary,
  // then earnings, then wins (mirrors the sort comparator above).
  const tiebreakerNote = activeMetric === 'wins' || activeMetric === 'top10s'
    ? 'Ties broken by season earnings, then wins'
    : 'Ties broken by season wins';

  return (
    <div className={className}>
      {activeMetric !== 'movers' && (
        <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: 8 }}>
          {/* Section header — shared SectionHeader in eyebrow-only mode */}
          <div style={{ padding: '14px 16px 6px' }}>
            <SectionHeader eyebrow={SECTION_EYEBROW[activeMetric]} />
            {isTiedAtOne && (
              <div style={{
                fontSize: 11, fontWeight: 500, color: '#94A3B8',
                marginTop: -10, marginBottom: 6, marginLeft: 13,
              }}>
                {tiebreakerNote}
              </div>
            )}
          </div>

          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '5px 16px', background: 'rgba(15,23,42,0.02)', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
            <span style={{ width: 32, fontSize: 10, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0, textAlign: 'center' as const }}>RK</span>
            <span style={{ flex: 1, fontSize: 10, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>FRANCHISE</span>
            <span style={{ width: 28, textAlign: 'center' as const, fontSize: 10, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>WIN</span>
            <span style={{ width: 28, textAlign: 'center' as const, fontSize: 10, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>T10</span>
            <span style={{ width: 72, textAlign: 'right' as const, fontSize: 10, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>
              {activeMetric === 'wins' ? 'WINS' : activeMetric === 'top10s' ? 'TOP 10s' : 'EARNINGS'}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeMetric}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid rgba(15,23,42,0.07)', gap: 10 }}>
                    <div style={{ width: 32, height: 14, background: 'rgba(15,23,42,0.06)', borderRadius: 4 }} className="animate-pulse" />
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(15,23,42,0.06)' }} className="animate-pulse" />
                    <div style={{ flex: 1, height: 14, background: 'rgba(15,23,42,0.06)', borderRadius: 4 }} className="animate-pulse" />
                    <div style={{ width: 60, height: 14, background: 'rgba(15,23,42,0.06)', borderRadius: 4 }} className="animate-pulse" />
                  </div>
                ))
              ) : sortedStats.length > 0 ? (
                <>
                  {sortedStats.map((collegeStats, index) => {
                    // Data layer and component conventions agree: positive
                    // earnings_rank_change = rank improved. Passed through
                    // unchanged to MovementIndicator.
                    const moverData = moverInfo?.moverData?.get(collegeStats.normalized_name);
                    const earningsRankChange = moverData?.rankChange ?? null;
                    const alumni = alumniMap?.get(collegeStats.normalized_name) || undefined;
                    const captain = captainMap?.get(collegeStats.normalized_name) ?? null;
                    return (
                      <FranchiseCard
                        key={collegeStats.normalized_name}
                        stats={collegeStats}
                        college={collegeMap?.get(collegeStats.normalized_name) || null}
                        rank={index + 1}
                        activeMetric={activeMetric}
                        alumni={alumni}
                        captain={captain}
                        earningsRankChange={earningsRankChange}
                        animationDelay={index * 0.03}
                      />
                    );
                  })}
                  <div style={{ padding: '12px 16px', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
                    <p style={{ fontSize: 10, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' as const, textAlign: 'center' as const, margin: 0 }}>
                      COLLEGE FRANCHISE RANKINGS · 2025–26 SEASON
                    </p>
                  </div>
                </>
              ) : activeMetric === 'wins' ? (
                <div style={{ padding: '48px 16px', textAlign: 'center' as const }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', margin: '0 0 4px' }}>No wins yet this season</p>
                  <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Check back as the season progresses.</p>
                </div>
              ) : (
                <div style={{ padding: '48px 16px', textAlign: 'center' as const }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', margin: '0 0 4px' }}>No data available</p>
                  <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Season stats are being calculated. Check back soon.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {activeMetric === 'movers' && <FranchiseMovers />}
    </div>
  );
}
