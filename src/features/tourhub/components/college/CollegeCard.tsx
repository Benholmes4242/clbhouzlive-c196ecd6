import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';
import type { AlumniFace } from '../../hooks/useBatchCollegeAlumni';

interface CollegeCardProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
  rank?: number;
  alumni?: AlumniFace[];
  className?: string;
}

/**
 * CollegeCard — Flat dispatch search result row
 */
export function CollegeCard({ stats, college, rank, alumni, className }: CollegeCardProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;
  const logoUrl = getCollegeLogoUrl(college?.college_name || stats.normalized_name);

  return (
    <Link
      to={`/tourhub/college-golf/${slug}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 16px',
        borderBottom: '0.5px solid rgba(15,23,42,0.07)',
        textDecoration: 'none',
      }}
      className={cn('active:bg-black/[0.02] transition-colors', className)}
    >
      {rank !== undefined && (
        <span style={{ fontSize: '12px', fontWeight: 900, color: '#94A3B8', width: '24px', textAlign: 'center' as const, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          #{rank}
        </span>
      )}
      {/* Logo chip */}
      <div style={{
        width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
        background: 'rgba(15,23,42,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {logoUrl ? (
          <img src={logoUrl} alt={displayName} style={{ width: '22px', height: '22px', objectFit: 'contain' }} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8' }}>{displayName.charAt(0)}</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {displayName}
        </p>
        <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>
          {stats.player_count} alumni
        </p>
      </div>
      <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(stats.earnings_total)}
        </p>
        <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>
          {stats.wins_total} wins · {stats.top10_total} top 10s
        </p>
      </div>
    </Link>
  );
}
