/**
 * FranchiseStoryStrip — Dispatch data band. Two compact inline rows:
 *   • This Week earnings delta + secondary metrics
 *   • Top Performer (captain) — name · earnings · OWGR
 *
 * Reads as a tight band between hero and H2H, not a padded 2-column panel.
 * Section rhythm: single 0.5px top hairline, no marginTop, no bottom border.
 */

import { Link } from 'react-router-dom';
import { useCollegeWeeklyMovers } from '../../hooks/useCollegeMovers';
import { useCollegeAlumni } from '../../hooks/useCollegeAlumni';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { playerRoute } from '../../routes';
import { AMBER, INK, INK_FAINT, INK_MUTE, INK_TINT_06, INK_TINT_07, LIVE_INK, SURFACE, TREND_DOWN } from '../../_shared/tokens';

interface FranchiseStoryStripProps {
  normalizedName: string;
  className?: string;
}

const EYEBROW: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: INK_MUTE,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
};

const LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  color: INK_FAINT,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  width: 80,
  flexShrink: 0,
};

export function FranchiseStoryStrip({ normalizedName, className }: FranchiseStoryStripProps) {
  const { data: moverRows, isLoading: moversLoading } = useCollegeWeeklyMovers({ collegeName: normalizedName });
  const { data: alumni, isLoading: alumniLoading } = useCollegeAlumni(normalizedName, { orderBy: 'earnings', limit: 1 });

  const isLoading = moversLoading || alumniLoading;

  if (isLoading) {
    return (
      <div className={className} style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}` }}>
        <div style={{ padding: '10px 16px 4px' }}>
          <div className="animate-pulse" style={{ width: 140, height: 9, borderRadius: 4, background: INK_TINT_06 }} />
        </div>
        {[1, 2].map(i => (
          <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderTop: i === 2 ? `0.5px solid ${INK_TINT_07}` : 'none' }}>
            <div style={{ width: 70, height: 9, borderRadius: 4, background: INK_TINT_06 }} />
            <div style={{ flex: 1, height: 12, borderRadius: 4, background: INK_TINT_06 }} />
          </div>
        ))}
      </div>
    );
  }

  const thisMover = moverRows?.[0] ?? null;
  const weekEarnings = thisMover?.earnings_delta || 0;
  const weekWins = thisMover?.wins_delta || 0;
  const weekTop10s = thisMover?.top10_delta || 0;
  const hasWeekActivity = weekEarnings !== 0 || weekWins > 0 || weekTop10s > 0;

  const topAlumnus = alumni?.[0];

  const secondaryWeekParts = [
    weekWins > 0 ? `${weekWins} ${weekWins === 1 ? 'win' : 'wins'}` : null,
    weekTop10s > 0 ? `${weekTop10s} top 10${weekTop10s === 1 ? '' : 's'}` : null,
  ].filter(Boolean).join(' · ');

  const performerLabel = alumni && alumni.length === 1 ? 'Alumni' : 'Top Performer';

  return (
    <div className={className} style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}` }}>
      {/* Eyebrow */}
      <div style={{ padding: '10px 16px 6px' }}>
        <span style={EYEBROW}>Franchise Dispatch</span>
      </div>

      {/* This Week — compact inline row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        minHeight: 32,
      }}>
        <span style={LABEL}>This Week</span>
        {hasWeekActivity ? (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' as const }}>
            {weekEarnings !== 0 && (
              <span style={{
                fontSize: 15,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: weekEarnings > 0 ? LIVE_INK : TREND_DOWN,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {weekEarnings > 0 ? '+' : ''}{formatCurrency(weekEarnings)}
              </span>
            )}
            {secondaryWeekParts && (
              <span style={{ fontSize: 11, color: INK_MUTE }}>{secondaryWeekParts}</span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: INK_FAINT, flex: 1 }}>No activity</span>
        )}
      </div>

      {/* Top Performer — compact inline row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px 12px',
        borderTop: `0.5px solid ${INK_TINT_07}`,
        minHeight: 32,
      }}>
        <span style={LABEL}>{performerLabel}</span>
        {topAlumnus ? (
          <Link
            {...playerRoute(topAlumnus.id, topAlumnus.college ? { kind: 'college', collegeName: topAlumnus.college } : undefined)}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              flexWrap: 'wrap' as const,
              textDecoration: 'none',
            }}
            className="active:opacity-70 transition-opacity"
          >
            <span style={{
              fontSize: 13,
              fontWeight: 800,
              color: INK,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
              maxWidth: '100%',
            }}>
              {topAlumnus.first_name} {topAlumnus.last_name}
            </span>
            {topAlumnus.earnings ? (
              <span style={{
                fontSize: 13,
                fontWeight: 800,
                color: AMBER,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {formatCurrency(topAlumnus.earnings)}
              </span>
            ) : null}
            {topAlumnus.world_ranking && topAlumnus.world_ranking > 0 && topAlumnus.world_ranking < 500 ? (
              <span style={{ fontSize: 11, color: INK_MUTE }}>#{topAlumnus.world_ranking} OWGR</span>
            ) : (topAlumnus.wins ?? 0) > 0 ? (
              <span style={{ fontSize: 11, color: INK_MUTE }}>{topAlumnus.wins} {topAlumnus.wins === 1 ? 'win' : 'wins'}</span>
            ) : null}
          </Link>
        ) : (
          <span style={{ fontSize: 12, color: INK_FAINT, flex: 1 }}>No data</span>
        )}
      </div>
    </div>
  );
}
