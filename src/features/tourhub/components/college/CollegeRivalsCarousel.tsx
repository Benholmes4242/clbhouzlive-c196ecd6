import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-semibold",
      "border",
      isWinning 
        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" 
        : isTied 
          ? "bg-muted border-border/50 text-muted-foreground"
          : "bg-rose-500/10 border-rose-500/30 text-rose-600"
    )}>
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
      <div className={cn('flex gap-3 overflow-x-auto pb-2', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="shrink-0 w-28 h-36 bg-card border border-border rounded-xl animate-pulse" />
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
    <div className={cn('flex gap-3 overflow-x-auto pb-2 -mx-4 px-4', className)}>
      {enrichedRivalries.map((rivalry) => {
        const rivalName = rivalry.rivalNormalizedName;
        const college = rivalry.college;
        const displayName = college?.short_name || college?.college_name || rivalName;
        
        const cardContent = (
          <>
            <div className="relative w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden mb-2 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
              {college?.logo_url ? (
                <img 
                  src={college.logo_url} 
                  alt={displayName}
                  className="w-10 h-10 object-contain relative z-10"
                  loading="lazy"
                />
              ) : (
                <span className="text-lg font-bold text-muted-foreground relative z-10">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            <p className="text-xs font-semibold text-foreground truncate w-full group-hover:text-primary transition-colors">
              {displayName}
            </p>
            
            {rivalry.h2h && (
              <div className="mt-1.5">
                <HeadToHeadChip {...rivalry.h2h} />
              </div>
            )}
            
            <span className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-0.5 group-hover:text-primary transition-colors">
              Compare <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </>
        );
        
        const cardStyles = cn(
          'shrink-0 w-28 p-3 rounded-xl',
          'bg-card border border-border',
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
          >
            {cardContent}
          </Link>
        );
      })}
    </div>
  );
}
