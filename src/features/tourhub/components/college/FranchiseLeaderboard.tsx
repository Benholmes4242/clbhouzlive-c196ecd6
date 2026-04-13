/**
 * FranchiseLeaderboard - Dispatch table wrapper with column headers
 */

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { useTopMovers } from '../../hooks/useCollegeStatus';
import { useBatchCollegeAlumni } from '../../hooks/useBatchCollegeAlumni';
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

export function FranchiseLeaderboard({ limit = 25, className, activeMetric: externalMetric, onMetricChange, hideHeader = false }: FranchiseLeaderboardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortParam = searchParams.get('sort') || 'earnings';
  const internalMetric: MetricTab = VALID_METRICS.has(sortParam) ? (sortParam as MetricTab) : 'earnings';

  const activeMetric = externalMetric ?? internalMetric;

  const setActiveMetric = (metric: MetricTab) => {
    if (onMetricChange) {
      onMetricChange(metric);
    } else {
      const params = new URLSearchParams(searchParams);
      if (metric === 'earnings') params.delete('sort');
      else params.set('sort', metric);
      setSearchParams(params, { replace: true });
    }
  };

  const { data: allStats, isLoading, error } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();
  const { data: moverInfo } = useTopMovers();

  const { sortedStats, maxValue } = useMemo(() => {
    if (!allStats) return { sortedStats: [], maxValue: 1 };
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
    const max = sorted.length > 0 ? getValue(sorted[0]) : 1;
    return { sortedStats: sorted, maxValue: max };
  }, [allStats, activeMetric, limit]);

  const collegeSlugs = useMemo(() => sortedStats.map(s => s.normalized_name), [sortedStats]);
  const { data: alumniMap } = useBatchCollegeAlumni(collegeSlugs, 3);

  return (
    <div className={className}>
      {activeMetric !== 'movers' && (
        <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
          {/* Section rule marker */}
          <div style={{ padding: '14px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
                {activeMetric === 'earnings' ? 'Season Earnings Leaderboard'
                  : activeMetric === 'wins' ? 'Season Wins Leaderboard'
                  : 'Top 10s Leaderboard'}
              </span>
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '5px 16px', background: 'rgba(15,23,42,0.02)', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
            <span style={{ width: '32px', fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0, textAlign: 'center' as const }}>RK</span>
            <span style={{ flex: 1, fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>FRANCHISE</span>
            <span style={{ width: '28px', textAlign: 'center' as const, fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>WIN</span>
            <span style={{ width: '28px', textAlign: 'center' as const, fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>T10</span>
            <span style={{ width: '72px', textAlign: 'right' as const, fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>
              {activeMetric === 'wins' ? 'WINS' : activeMetric === 'top10s' ? 'TOP 10s' : 'EARNINGS'}
            </span>
          </div>

          {/* Animated list */}
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
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid rgba(15,23,42,0.07)', gap: '10px' }}>
                    <div style={{ width: '32px', height: '14px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} className="animate-pulse" />
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(15,23,42,0.06)' }} className="animate-pulse" />
                    <div style={{ flex: 1, height: '14px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} className="animate-pulse" />
                    <div style={{ width: '60px', height: '14px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} className="animate-pulse" />
                  </div>
                ))
              ) : sortedStats.length > 0 ? (
                <>
                  {sortedStats.map((collegeStats, index) => {
                    const moverData = moverInfo?.moverData?.get(collegeStats.normalized_name);
                    const momentum = moverData ? {
                      rankChange: moverData.rankChange,
                      earningsDelta: moverData.earningsDelta,
                      isRising: moverData.earningsDelta > 0 || (moverData.rankChange !== null && moverData.rankChange > 0),
                    } : null;
                    const alumni = alumniMap?.get(collegeStats.normalized_name) || undefined;
                    return (
                      <FranchiseCard
                        key={collegeStats.normalized_name}
                        stats={collegeStats}
                        college={collegeMap?.get(collegeStats.normalized_name) || null}
                        rank={index + 1}
                        maxValue={maxValue}
                        activeMetric={activeMetric}
                        momentum={momentum}
                        alumni={alumni}
                        animationDelay={index * 0.03}
                      />
                    );
                  })}
                  {/* Footer */}
                  <div style={{ padding: '12px 16px', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
                    <p style={{ fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' as const, textAlign: 'center' as const, margin: 0 }}>
                      COLLEGE FRANCHISE RANKINGS · 2025–26 SEASON
                    </p>
                  </div>
                </>
              ) : activeMetric === 'wins' ? (
                <div style={{ padding: '48px 16px', textAlign: 'center' as const }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: '0 0 4px' }}>No wins yet this season</p>
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Check back as the season progresses.</p>
                </div>
              ) : (
                <div style={{ padding: '48px 16px', textAlign: 'center' as const }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: '0 0 4px' }}>No data available</p>
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Season stats are being calculated. Check back soon.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {activeMetric === 'movers' && (
        <FranchiseMovers />
      )}
    </div>
  );
}
