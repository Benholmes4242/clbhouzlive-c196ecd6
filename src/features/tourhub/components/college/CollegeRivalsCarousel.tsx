import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { useCollegeRivalries } from '../../hooks/useCollegeMovers';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';

interface CollegeRivalsCarouselProps {
  normalizedName: string;
  className?: string;
  onCompare?: (rivalNormalizedName: string) => void;
}

function formatDelta(amount: number): string {
  const sign = amount >= 0 ? '+' : '';
  if (Math.abs(amount) >= 1_000_000) {
    return `${sign}$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${sign}$${Math.round(amount / 1_000)}K`;
  }
  return `${sign}$${amount.toFixed(0)}`;
}

interface HeadToHeadChipProps {
  winsA: number;
  winsB: number;
  earningsDiff: number;
  winner: 'A' | 'B' | 'tie';
}

function HeadToHeadChip({ winsA, winsB, earningsDiff, winner }: HeadToHeadChipProps) {
  const isWinning = winner === 'A';
  const isTied = winner === 'tie';
  
  return (
    <div
      className="rounded-full"
      style={{
        fontSize: '11px',
        fontWeight: 600,
        padding: '4px 10px',
        backgroundColor: isWinning ? 'rgba(34,197,94,0.1)' : isTied ? 'hsl(var(--muted))' : 'rgba(239,68,68,0.1)',
        color: isWinning ? '#22C55E' : isTied ? 'hsl(var(--muted-foreground))' : 'hsl(var(--destructive))',
      }}
    >
      {isTied ? 'Tied' : isWinning ? `W ${winsA}–${winsB}` : `L ${winsA}–${winsB}`}
    </div>
  );
}

export function CollegeRivalsCarousel({ normalizedName, className, onCompare }: CollegeRivalsCarouselProps) {
  const { data: rivalries, isLoading } = useCollegeRivalries(normalizedName);
  const { data: allStats } = useCollegeSeasonStats();
  
  const enrichedRivalries = useMemo(() => {
    if (!rivalries || !allStats) return [];
    
    const myStats = allStats.find(s => s.normalized_name === normalizedName);
    if (!myStats) return rivalries.map(r => ({ ...r, h2h: null }));
    
    return rivalries.map(rivalry => {
      const rivalStats = allStats.find(s => s.normalized_name === rivalry.rivalNormalizedName);
      if (!rivalStats) return { ...rivalry, h2h: null };
      
      let winsA = 0;
      let winsB = 0;
      
      if (myStats.earnings_total > rivalStats.earnings_total) winsA++;
      else if (rivalStats.earnings_total > myStats.earnings_total) winsB++;
      
      if (myStats.wins_total > rivalStats.wins_total) winsA++;
      else if (rivalStats.wins_total > myStats.wins_total) winsB++;
      
      if (myStats.cuts_total > rivalStats.cuts_total) winsA++;
      else if (rivalStats.cuts_total > myStats.cuts_total) winsB++;
      
      if (myStats.top10_total > rivalStats.top10_total) winsA++;
      else if (rivalStats.top10_total > myStats.top10_total) winsB++;
      
      const earningsDiff = myStats.earnings_total - rivalStats.earnings_total;
      
      return {
        ...rivalry,
        h2h: {
          winsA,
          winsB,
          earningsDiff,
          winner: winsA > winsB ? 'A' : winsB > winsA ? 'B' : 'tie',
        } as const,
      };
    });
  }, [rivalries, allStats, normalizedName]);
  
  if (isLoading) {
    return (
      <div className={cn('flex gap-2 overflow-x-auto pb-2 px-4 -mx-4', className)} style={{ touchAction: 'pan-x pan-y' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="shrink-0 h-44 bg-card border border-border/50 rounded-2xl animate-pulse" style={{ width: '160px' }} />
        ))}
      </div>
    );
  }
  
  if (!enrichedRivalries?.length) {
    return (
      <div className={cn('flex items-center justify-center py-8 px-4', className)}>
        <div className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No rivals defined yet</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('flex overflow-x-auto pb-2 -mx-4 px-4', className)} style={{ gap: '10px', touchAction: 'pan-x pan-y' }}>
      {enrichedRivalries.map((rivalry) => {
        const rivalName = rivalry.rivalNormalizedName;
        const college = rivalry.college;
        const displayName = college?.short_name || college?.college_name || rivalName;
        
        const cardContent = (
          <>
            {/* Logo with circular muted background */}
            <div className="relative flex items-center justify-center rounded-full bg-muted/20" style={{ width: '72px', height: '72px' }}>
              {getCollegeLogoUrl(college?.college_name || rivalName) ? (
                <img 
                  src={getCollegeLogoUrl(college?.college_name || rivalName)!} 
                  alt={displayName}
                  className="object-contain relative z-10"
                  style={{ width: '56px', height: '56px' }}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span className="text-lg font-bold text-muted-foreground relative z-10">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Name — 14px, weight 600, centered */}
            <p className="text-foreground truncate w-full group-hover:text-primary transition-colors text-center" style={{ fontSize: '14px', fontWeight: 600, marginTop: '10px' }}>
              {displayName}
            </p>
            
            {/* Record pill */}
            {rivalry.h2h && (
              <div style={{ marginTop: '6px' }}>
                <HeadToHeadChip {...rivalry.h2h} />
              </div>
            )}
            
            {/* Compare → */}
            <span className="text-muted-foreground flex items-center gap-0.5 group-hover:text-primary transition-colors" style={{ fontSize: '12px', fontWeight: 500, marginTop: '8px' }}>
              Compare <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </>
        );
        
        const cardStyles = cn(
          'shrink-0 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
          'bg-card border border-border/50',
          'hover:border-primary/30 hover:bg-card/90 transition-all duration-200',
          'active:scale-[0.98]',
          'flex flex-col items-center text-center group'
        );
        
        if (onCompare) {
          return (
            <button
              key={rivalry.id}
              onClick={() => onCompare(rivalName)}
              className={cardStyles}
              style={{ width: '160px', padding: '16px' }}
            >
              {cardContent}
            </button>
          );
        }
        
        return (
          <Link
            key={rivalry.id}
            to={`/tourhub/college-golf/compare?c1=${normalizedName}&c2=${rivalName}`}
            className={cardStyles}
            style={{ width: '160px', padding: '16px' }}
          >
            {cardContent}
          </Link>
        );
      })}
    </div>
  );
}
