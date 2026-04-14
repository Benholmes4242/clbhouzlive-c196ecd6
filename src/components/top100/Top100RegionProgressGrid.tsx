import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, ChevronRight } from 'lucide-react';
import { FaLandmarkDome, FaFlagUsa } from 'react-icons/fa6';
import { GiEuropeanFlag, GiWorld } from 'react-icons/gi';
import { Top100ListProgress } from '@/hooks/useTop100ProgressForUser';
import { cn } from '@/lib/utils';

interface Top100RegionProgressGridProps {
  lists: Top100ListProgress[];
  isOwnProfile?: boolean;
  displayName?: string | null;
}

// Region color config - Modern Country Club golf palette
const REGION_COLORS: Record<string, { bg: string; fill: string; hover: string }> = {
  'global': {
    bg: 'bg-[#334E3D]/8',
    fill: 'bg-[#334E3D]/60',
    hover: 'hover:bg-[#334E3D]/12'
  },
  'global-top-100': {
    bg: 'bg-[#334E3D]/8',
    fill: 'bg-[#334E3D]/60',
    hover: 'hover:bg-[#334E3D]/12'
  },
  'gb-i': {
    bg: 'bg-[#334E3D]/8',
    fill: 'bg-[#334E3D]/60',
    hover: 'hover:bg-[#334E3D]/12'
  },
  'gb-i-top-100': {
    bg: 'bg-[#334E3D]/8',
    fill: 'bg-[#334E3D]/60',
    hover: 'hover:bg-[#334E3D]/12'
  },
  'usa': {
    bg: 'bg-[#C1A84C]/8',
    fill: 'bg-[#C1A84C]/60',
    hover: 'hover:bg-[#C1A84C]/12'
  },
  'usa-top-100': {
    bg: 'bg-[#C1A84C]/8',
    fill: 'bg-[#C1A84C]/60',
    hover: 'hover:bg-[#C1A84C]/12'
  },
  'europe': {
    bg: 'bg-[#64748B]/8',
    fill: 'bg-[#64748B]/60',
    hover: 'hover:bg-[#64748B]/12'
  },
  'europe-top-100': {
    bg: 'bg-[#64748B]/8',
    fill: 'bg-[#64748B]/60',
    hover: 'hover:bg-[#64748B]/12'
  },
};

const DEFAULT_REGION_COLOR = {
  bg: 'bg-[rgba(15,23,42,0.04)]',
  fill: 'bg-[#0F172A]/40',
  hover: 'hover:bg-[rgba(15,23,42,0.06)]'
};

function getRegionColors(slug: string) {
  return REGION_COLORS[slug] || DEFAULT_REGION_COLOR;
}

function getRegionIcon(slug: string) {
  const iconClass = "w-4 h-4";

  switch (slug) {
    case 'global-top-100':
    case 'global':
      return <GiWorld className={iconClass} />;
    case 'gb-i-top-100':
    case 'gb-i':
      return <FaLandmarkDome className={iconClass} />;
    case 'usa-top-100':
    case 'usa':
      return <FaFlagUsa className={iconClass} />;
    case 'europe-top-100':
    case 'europe':
      return <GiEuropeanFlag className={iconClass} />;
    default:
      return <Map className={iconClass} />;
  }
}

// Short display names to avoid truncation (D1)
function getShortDisplayName(listName: string, slug: string): string {
  switch (slug) {
    case 'global':
      return 'World Top 100';
    case 'gb-i':
      return 'GB&I Top 100';
    case 'usa':
      return 'USA Top 100';
    case 'europe':
      return 'Europe Top 100';
    default:
      return listName;
  }
}

export function Top100RegionProgressGrid({
  lists,
  isOwnProfile = true,
  displayName: userDisplayName,
}: Top100RegionProgressGridProps) {
  const navigate = useNavigate();

  const label = isOwnProfile
    ? 'YOUR JOURNEY BY REGION'
    : `${userDisplayName?.toUpperCase() ?? 'THEIR'} JOURNEY BY REGION`;

  const handleCardClick = (slug: string) => {
    navigate(`/top100/${slug}`);
  };

  return (
    <>
      <section className="w-full px-4">
        {/* Section header - mb-4 */}
        <div className="flex items-center gap-1.5 mb-4">
          <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>{label}</span>
        </div>

        {/* Region rows - flat on bg-slate-50, py-4 each, dividers */}
        <div>
          {lists.map((list, index) => {
            const progressPercent =
              list.total > 0 ? (list.played / list.total) * 100 : 0;
            const remainingPercent = Math.round(100 - progressPercent);
            const displayName = getShortDisplayName(list.listName, list.listSlug);
            const regionColors = getRegionColors(list.listSlug);

            return (
              <React.Fragment key={list.listSlug}>
                <button
                  type="button"
                  onClick={() => handleCardClick(list.listSlug)}
                  className="w-full py-4 text-left hover:bg-slate-100/50 transition-all duration-200 flex items-center justify-between gap-3 group"
                >
                {/* Left side: region-tinted icon container + names */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-sq-sm flex items-center justify-center flex-shrink-0 text-foreground/70 transition-all duration-200",
                      regionColors.bg,
                      regionColors.hover
                    )}
                  >
                    {getRegionIcon(list.listSlug)}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {list.played} / {list.total} courses played
                    </span>
                  </div>
                </div>

                {/* Right side: percentage above bar + region-colored progress fill with gradient */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[100px]">
                  <span className="text-[9px] text-muted-foreground font-medium tabular-nums">
                    {remainingPercent}% remaining
                  </span>

                {/* Progress bar with gradient fill */}
                  <div 
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(15,23,42,0.08)' }}
                    role="progressbar"
                    aria-valuenow={Math.round(progressPercent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${displayName} progress: ${list.played} of ${list.total} courses played`}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300 group-hover:shadow-sm",
                        regionColors.fill
                      )}
                      style={{ 
                        width: `${progressPercent}%`,
                        // Add subtle gradient overlay
                        backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 100%)',
                      }}
                    />
                  </div>
                </div>

                {/* Chevron hint */}
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors flex-shrink-0" />
              </button>
              {index < lists.length - 1 && (
                <div className="h-px bg-slate-200/60" />
              )}
            </React.Fragment>
          );
        })}
      </div>
      </section>
    </>
  );
}