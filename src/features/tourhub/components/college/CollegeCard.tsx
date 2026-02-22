import { Link } from 'react-router-dom';
import { Users, DollarSign, Trophy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getR2HeadshotUrlMultiTour } from '@/utils/playerHeadshot';
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
 * CollegeCard — Matches PlayerCardV2 layout (110px height, photo left, info right)
 */
export function CollegeCard({ stats, college, rank, alumni, className }: CollegeCardProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;

  return (
    <Link
      to={`/tourhub/college-golf/${slug}`}
      className={cn(
        "flex overflow-hidden",
        "bg-card rounded-xl border border-border/40 shadow-sm",
        "hover:border-primary/30 hover:shadow-md",
        "active:scale-[0.98] transition-all",
        className
      )}
      style={{ height: '110px' }}
    >
      {/* Logo section — left ~110px, matching PlayerCardV2 photo area */}
      <div className="relative w-[110px] shrink-0 bg-muted overflow-hidden flex items-center justify-center">
        {getCollegeLogoUrl(college?.college_name || stats.normalized_name) ? (
          <img
            src={getCollegeLogoUrl(college?.college_name || stats.normalized_name)!}
            alt={displayName}
            className="w-16 h-16 object-contain"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-muted-foreground/40">{displayName.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Info section — right */}
      <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-center">
        {/* Name + Rank */}
        <div className="flex items-center gap-2">
          {rank !== undefined && (
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">#{rank}</span>
          )}
          <h3 className="text-base font-semibold text-foreground truncate leading-tight">{displayName}</h3>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold font-mono tabular-nums text-[hsl(var(--tab-orange))]">
            <DollarSign className="w-3.5 h-3.5" />
            {formatCurrency(stats.earnings_total)}
          </span>
          {stats.wins_total > 0 && (
            <span className="inline-flex items-center gap-1 text-[13px] font-medium text-primary">
              <Trophy className="w-3.5 h-3.5" />
              {stats.wins_total}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50">
            <Users className="w-3 h-3" />
            {stats.player_count}
          </span>
        </div>

        {/* Alumni face preview */}
        {alumni && alumni.length > 0 && (
          <div className="flex items-center -space-x-1.5 mt-2">
            {alumni.slice(0, 3).map(a => {
              const photoUrl = getR2HeadshotUrlMultiTour(a.full_name);
              return (
                <div key={a.id} className="w-5 h-5 border border-card overflow-hidden bg-muted" style={{ borderRadius: '34%' }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt={a.full_name} className="w-full h-full object-cover object-top" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chevron */}
      <div className="flex items-center pr-3 shrink-0">
        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
      </div>
    </Link>
  );
}
