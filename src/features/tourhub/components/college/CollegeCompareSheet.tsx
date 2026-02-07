/**
 * CollegeCompareSheet - Bottom sheet for quick college comparison
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, DollarSign, Scissors, Target, ArrowRight, Check, Users, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from '../../hooks/useCollegeMedia';

type CompareMetric = 'earnings' | 'wins' | 'cuts' | 'top10s';

interface CollegeCompareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  college1: string;
  college2: string;
  rivals?: string[];
  onCollegeChange?: (rivalSlug: string) => void;
}

function formatValue(value: number, metric: CompareMetric): string {
  if (metric === 'earnings') {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${value}`;
  }
  return value.toString();
}

interface CollegeSideProps {
  college: CollegeMedia | null;
  value: number;
  metric: CompareMetric;
  isWinner: boolean;
}

function CollegeSide({ college, value, metric, isWinner }: CollegeSideProps) {
  const displayName = college?.short_name || college?.college_name || 'Unknown';
  
  return (
    <div className="flex flex-col items-center flex-1">
      <div className={cn(
        "relative w-16 h-16 rounded-full mb-3",
        "bg-background border-2",
        isWinner ? "border-primary shadow-lg shadow-primary/20" : "border-border/50",
        "flex items-center justify-center overflow-hidden",
        "transition-all duration-300"
      )}>
        {isWinner && (
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
        )}
        {college?.logo_url ? (
          <img 
            src={college.logo_url} 
            alt={displayName}
            className="w-12 h-12 object-contain relative z-10"
          />
        ) : (
          <span className="text-xl font-bold text-muted-foreground/60 relative z-10">
            {displayName.charAt(0)}
          </span>
        )}
      </div>
      
      <h4 className="text-sm font-medium text-foreground text-center mb-2 line-clamp-1">
        {displayName}
      </h4>
      
      <motion.div
        key={`${college?.normalized_name}-${metric}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "text-xl font-bold tabular-nums",
          isWinner ? "text-primary" : "text-muted-foreground"
        )}
      >
        {formatValue(value, metric)}
      </motion.div>
    </div>
  );
}

interface RivalChipProps {
  normalizedName: string;
  college: CollegeMedia | null;
  isSelected: boolean;
  onClick: () => void;
}

function RivalChip({ normalizedName, college, isSelected, onClick }: RivalChipProps) {
  const displayName = college?.short_name || college?.college_name || normalizedName;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl",
        "border transition-all duration-200",
        "active:scale-95",
        isSelected 
          ? "bg-muted border-border shadow-sm" 
          : "bg-card border-border hover:bg-muted/80"
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden",
        "bg-muted"
      )}>
        {college?.logo_url ? (
          <img 
            src={college.logo_url} 
            alt={displayName}
            className="w-5 h-5 object-contain"
          />
        ) : (
          <span className="text-xs font-bold text-muted-foreground">
            {displayName.charAt(0)}
          </span>
        )}
      </div>
      
      <span className={cn(
        "text-xs font-medium whitespace-nowrap",
        isSelected ? "text-foreground" : "text-muted-foreground"
      )}>
        {displayName}
      </span>
      
      {isSelected && (
        <Check className="w-3.5 h-3.5 text-foreground" />
      )}
    </button>
  );
}

const METRICS: { key: CompareMetric; label: string; icon: React.ElementType }[] = [
  { key: 'earnings', label: 'Earnings', icon: DollarSign },
  { key: 'wins', label: 'Wins', icon: Trophy },
  { key: 'cuts', label: 'Cuts', icon: Scissors },
  { key: 'top10s', label: 'Top 10s', icon: Target },
];

export function CollegeCompareSheet({ 
  isOpen, 
  onClose, 
  college1, 
  college2, 
  rivals = [],
  onCollegeChange 
}: CollegeCompareSheetProps) {
  const [activeMetric, setActiveMetric] = useState<CompareMetric>('earnings');
  const [selectedCollege2, setSelectedCollege2] = useState(college2);
  
  const { data: allStats, isLoading: statsLoading, error: statsError } = useCollegeSeasonStats();
  const { data: collegeMap, isLoading: mediaLoading, error: mediaError } = useCollegeMediaMap();

  useEffect(() => {
    if (isOpen && college2) {
      setSelectedCollege2(college2);
    }
  }, [college2, isOpen]);

  const stats1 = allStats?.find(s => s.normalized_name === college1);
  const stats2 = allStats?.find(s => s.normalized_name === selectedCollege2);
  const media1 = collegeMap?.get(college1) || null;
  const media2 = collegeMap?.get(selectedCollege2) || null;

  const hasError = (statsError || mediaError) || (!statsLoading && !mediaLoading && !stats1 && college1);
  const hasNoRivals = rivals.length === 0;

  const getValue = (stats: typeof stats1, metric: CompareMetric): number => {
    if (!stats) return 0;
    switch (metric) {
      case 'earnings': return stats.earnings_total;
      case 'wins': return stats.wins_total;
      case 'cuts': return stats.cuts_total;
      case 'top10s': return stats.top10_total;
    }
  };

  const value1 = getValue(stats1, activeMetric);
  const value2 = getValue(stats2, activeMetric);
  
  const handleRivalSelect = (rivalSlug: string) => {
    setSelectedCollege2(rivalSlug);
    onCollegeChange?.(rivalSlug);
  };
  
  const hasValidComparison = college1 && selectedCollege2 && !hasNoRivals;

  if (hasError) {
    console.error('CollegeCompareSheet: Failed to load college data', { 
      college1, statsError, mediaError, stats1Exists: !!stats1 
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-card rounded-t-3xl",
              "border-t border-border",
              "shadow-2xl shadow-black/20",
              "max-h-[85vh] overflow-hidden"
            )}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            
            <div className="flex items-center justify-between px-4 pb-3">
              <h3 className="text-lg font-semibold text-foreground">Head to Head</h3>
              <button
                onClick={onClose}
                className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {hasError && (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Unable to load college data</p>
                <p className="text-xs text-muted-foreground text-center mb-4">
                  There was an error loading the comparison data.
                </p>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>
            )}

            {!hasError && hasNoRivals && (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No rivals defined yet</p>
                <p className="text-xs text-muted-foreground text-center">
                  This college has no defined rivals to compare against.
                </p>
              </div>
            )}

            {!hasError && rivals.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Select Rival</p>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                  {rivals.map((rivalSlug) => (
                    <RivalChip
                      key={rivalSlug}
                      normalizedName={rivalSlug}
                      college={collegeMap?.get(rivalSlug) || null}
                      isSelected={selectedCollege2 === rivalSlug}
                      onClick={() => handleRivalSelect(rivalSlug)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {!hasError && !hasNoRivals && (
              <div className="flex gap-2 px-4 pb-4">
                {METRICS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveMetric(key)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg",
                      "text-xs font-medium transition-all",
                      "active:scale-95",
                      activeMetric === key
                        ? "bg-card text-foreground border border-border shadow-sm"
                        : "bg-muted text-muted-foreground border border-transparent hover:bg-muted/80"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            )}
            
            {!hasError && !hasNoRivals && hasValidComparison && (
              <div className="flex items-center justify-around px-6 py-6">
                <CollegeSide college={media1} value={value1} metric={activeMetric} isWinner={value1 > value2} />
                <div className="mx-4 px-3 py-1.5 rounded-full bg-muted text-xs font-bold text-muted-foreground">VS</div>
                <CollegeSide college={media2} value={value2} metric={activeMetric} isWinner={value2 > value1} />
              </div>
            )}
            
            {!hasError && !hasNoRivals && (
              <div className="px-4 pb-8">
                {hasValidComparison ? (
                  <Link to={`/tourhub/college-golf/compare?c1=${college1}&c2=${selectedCollege2}`}>
                    <Button className="w-full gap-2" onClick={onClose}>
                      Full Comparison
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full gap-2" disabled>
                    Select a rival to compare
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
