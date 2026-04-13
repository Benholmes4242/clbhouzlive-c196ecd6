/**
 * FranchiseMovers - Dispatch movers table
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollegeWeeklyMovers } from '../../hooks/useCollegeMovers';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useBatchCollegeAlumni } from '../../hooks/useBatchCollegeAlumni';
import { FranchiseCard } from './FranchiseCard';
import { format } from 'date-fns';

type Direction = 'up' | 'down';

interface FranchiseMoversProps {
  limit?: number;
  className?: string;
}

export function FranchiseMovers({ limit = 8, className }: FranchiseMoversProps) {
  const [direction, setDirection] = useState<Direction>('up');
  const { data: movers, isLoading } = useCollegeWeeklyMovers({ direction, limit });
  const { data: collegeMap } = useCollegeMediaMap();
  const { data: allStats } = useCollegeSeasonStats();

  const statsMap = useMemo(() => {
    if (!allStats) return new Map();
    return new Map(allStats.map(s => [s.normalized_name, s]));
  }, [allStats]);

  const enrichedMovers = (movers || []).map(mover => ({
    ...mover,
    college: collegeMap?.get(mover.normalized_name) || mover.college || null,
    stats: statsMap.get(mover.normalized_name) || null,
  }));

  const slugs = useMemo(() => enrichedMovers.map(m => m.normalized_name), [enrichedMovers]);
  const { data: alumniMap } = useBatchCollegeAlumni(slugs, 3);

  const weekStart = movers?.[0]?.week_start;
  const weekLabel = weekStart
    ? (() => {
        const start = new Date(weekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `Week of ${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
      })()
    : null;

  return (
    <div className={className}>
      {/* Section header */}
      <div style={{ padding: '14px 16px 0', background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Weekly Franchise Movers
          </span>
        </div>
        {weekLabel && (
          <p style={{ fontSize: '10px', color: '#94A3B8', margin: '0 0 8px 11px' }}>
            {weekLabel}
          </p>
        )}
      </div>

      {/* Rising / Falling toggle */}
      <div style={{ padding: '0 16px 8px', background: '#ffffff' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 'up' as Direction, label: '📈 Rising' },
            { value: 'down' as Direction, label: '📉 Falling' },
          ].map(({ value, label }) => {
            const isSelected = direction === value;
            return (
              <button
                key={value}
                onClick={() => setDirection(value)}
                className="flex-1 active:scale-[0.97] transition-transform"
                style={{
                  padding: '7px 0', borderRadius: '8px',
                  fontSize: '11px', fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? '#ffffff' : '#94A3B8',
                  background: isSelected ? '#0F172A' : 'transparent',
                  border: isSelected ? 'none' : '0.5px solid rgba(15,23,42,0.12)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Movers table */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
        {/* Column headers */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '5px 16px', background: 'rgba(15,23,42,0.02)', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
          <span style={{ width: '32px', fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0, textAlign: 'center' as const }}>RK</span>
          <span style={{ flex: 1, fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>FRANCHISE</span>
          <span style={{ width: '40px', textAlign: 'center' as const, fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>MOVE</span>
          <span style={{ width: '72px', textAlign: 'right' as const, fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>EARNINGS Δ</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={direction}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ height: '44px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }} className="animate-pulse" />
              ))
            ) : enrichedMovers.length > 0 ? (
              enrichedMovers.map((mover, idx) => {
                if (!mover.stats) return null;
                const alumni = alumniMap?.get(mover.normalized_name) || undefined;

                return (
                  <FranchiseCard
                    key={mover.id}
                    stats={mover.stats}
                    college={mover.college}
                    activeMetric="earnings"
                    alumni={alumni}
                    animationDelay={idx * 0.03}
                    isDelta
                    deltas={{
                      earnings_delta: mover.earnings_delta,
                      wins_delta: mover.wins_delta,
                      top10_delta: mover.top10_delta,
                      earnings_rank_change: mover.earnings_rank_change,
                    }}
                  />
                );
              })
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center' as const }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: '0 0 4px' }}>
                  {direction === 'up' ? 'No risers this week' : 'No fallers this week'}
                </p>
                <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
                  {direction === 'up'
                    ? 'No colleges climbed the rankings this week.'
                    : 'No colleges dropped in the rankings this week.'}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
          <p style={{ fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' as const, textAlign: 'center' as const, margin: 0 }}>
            WEEKLY EARNINGS CHANGE · {weekLabel?.toUpperCase() ?? 'CURRENT WEEK'}
          </p>
        </div>
      </div>
    </div>
  );
}
