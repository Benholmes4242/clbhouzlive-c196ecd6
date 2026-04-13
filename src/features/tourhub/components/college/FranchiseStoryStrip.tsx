/**
 * FranchiseStoryStrip - Dispatch 2-cell strip: This Week + Top Performer
 */

import { Link } from 'react-router-dom';
import { useCollegeWeeklyMovers } from '../../hooks/useCollegeMovers';
import { useCollegeAlumni } from '../../hooks/useCollegeAlumni';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface FranchiseStoryStripProps {
  normalizedName: string;
  className?: string;
}

export function FranchiseStoryStrip({ normalizedName, className }: FranchiseStoryStripProps) {
  const { data: moverRows, isLoading: moversLoading } = useCollegeWeeklyMovers({ collegeName: normalizedName });
  const { data: alumni, isLoading: alumniLoading } = useCollegeAlumni(normalizedName, { orderBy: 'earnings', limit: 1 });

  const isLoading = moversLoading || alumniLoading;

  if (isLoading) {
    return (
      <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
        <div style={{ padding: '12px 20px 0' }}>
          <div className="animate-pulse" style={{ width: '140px', height: '9px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)', marginBottom: '10px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse" style={{ padding: '10px 20px 14px', borderRight: i === 1 ? '0.5px solid rgba(15,23,42,0.07)' : 'none' }}>
              <div style={{ height: '8px', width: '60px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)', marginBottom: '8px' }} />
              <div style={{ height: '18px', width: '80px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)', marginBottom: '6px' }} />
              <div style={{ height: '10px', width: '100px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const thisMover = moverRows?.[0] ?? null;
  const weekEarnings = thisMover?.earnings_delta || 0;
  const weekWins = thisMover?.wins_delta || 0;
  const weekTop10s = thisMover?.top10_delta || 0;

  const topAlumnus = alumni?.[0];

  const hasWeekActivity = weekEarnings !== 0 || weekWins > 0 || weekTop10s > 0;

  const secondaryWeekParts = [
    weekWins > 0 ? `${weekWins} win${weekWins > 1 ? 's' : ''}` : null,
    weekTop10s > 0 ? `${weekTop10s} top 10${weekTop10s > 1 ? 's' : ''}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className={className} style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
      {/* Section rule marker */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Franchise Dispatch
          </span>
        </div>
      </div>

      {/* Two flat cells */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* This Week */}
        <div style={{ padding: '10px 20px 14px', borderRight: '0.5px solid rgba(15,23,42,0.07)' }}>
          <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>
            This Week
          </div>
          {hasWeekActivity ? (
            <>
              {weekEarnings !== 0 && (
                <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, color: weekEarnings > 0 ? '#16A34A' : '#DC2626', marginBottom: '3px' }}>
                  {weekEarnings > 0 ? '+' : ''}{formatCurrency(weekEarnings)}
                </div>
              )}
              {secondaryWeekParts && (
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                  {secondaryWeekParts}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>No activity</div>
          )}
        </div>

        {/* Top Performer */}
        <div style={{ padding: '10px 20px 14px' }}>
          <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>
            {alumni && alumni.length === 1 ? 'Alumni' : 'Top Performer'}
          </div>
          {topAlumnus ? (
            <Link
              to={`/tourhub/player/${topAlumnus.id}`}
              style={{ display: 'block', textDecoration: 'none' }}
              className="active:opacity-70 transition-opacity"
            >
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: '2px' }}>
                {topAlumnus.first_name} {topAlumnus.last_name}
              </div>
              {topAlumnus.earnings ? (
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#F7931E', marginBottom: '2px', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(topAlumnus.earnings)}
                </div>
              ) : null}
              <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>
                {[
                  (topAlumnus.wins ?? 0) > 0 ? `${topAlumnus.wins} ${topAlumnus.wins === 1 ? 'win' : 'wins'}` : null,
                  topAlumnus.world_ranking && topAlumnus.world_ranking < 500 ? `#${topAlumnus.world_ranking} OWGR` : null,
                ].filter(Boolean).join(' · ')}
              </div>
            </Link>
          ) : (
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
