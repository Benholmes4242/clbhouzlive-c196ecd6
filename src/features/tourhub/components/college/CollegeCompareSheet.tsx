/**
 * CollegeCompareSheet - Bottom sheet for quick college comparison
 * Hides bottom nav when open, dark overlay, winning stat highlighted
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Check, Users, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { Button } from '@/components/ui/button';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from '../../hooks/useCollegeMedia';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

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
      {/* Logo with circular muted bg — 72px logo, 88px bg */}
      <div
        className="rounded-full flex items-center justify-center overflow-hidden"
        style={{
          width: '88px',
          height: '88px',
          backgroundColor: 'hsl(var(--muted) / 0.2)',
        }}
      >
        {getCollegeLogoUrl(college?.college_name || displayName) ? (
          <img 
            src={getCollegeLogoUrl(college?.college_name || displayName)!} 
            alt={displayName}
            className="object-contain relative z-10"
            style={{ width: '72px', height: '72px' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <span className="text-xl font-bold text-muted-foreground/60 relative z-10">
            {displayName.charAt(0)}
          </span>
        )}
      </div>
      
      {/* Name — 14px, weight 600, centered */}
      <h4 className="text-foreground text-center line-clamp-1" style={{ fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>
        {displayName}
      </h4>
      
      {/* Stat value — JetBrains Mono, 22px, weight 800 */}
      <motion.div
        key={`${college?.normalized_name}-${metric}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '22px',
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          marginTop: '4px',
        }}
        className={isWinner ? 'text-foreground' : 'text-muted-foreground'}
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
        "shrink-0 flex items-center rounded-xl",
        "border transition-all duration-200",
        "active:scale-95 min-h-[44px]",
        isSelected 
          ? "bg-muted/30 border-border" 
          : "bg-card border-border/50 hover:bg-muted/80"
      )}
      style={{ padding: '10px 16px', gap: '8px' }}
    >
      {/* College logo — 24×24px */}
      <div className="flex items-center justify-center overflow-hidden" style={{ width: '24px', height: '24px' }}>
        {getCollegeLogoUrl(college?.college_name || displayName) ? (
          <img src={getCollegeLogoUrl(college?.college_name || displayName)!} alt={displayName} className="w-6 h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <span className="text-xs font-bold text-muted-foreground">{displayName.charAt(0)}</span>
        )}
      </div>
      
      <span className={cn(
        "whitespace-nowrap",
        isSelected ? "text-foreground" : "text-muted-foreground"
      )} style={{ fontSize: '13px', fontWeight: 500 }}>
        {displayName}
      </span>
      
      {isSelected && <Check className="w-4 h-4 text-foreground" />}
    </button>
  );
}

const METRICS: { key: CompareMetric; label: string }[] = [
  { key: 'earnings', label: 'Earnings' },
  { key: 'wins', label: 'Wins' },
  { key: 'cuts', label: 'Cuts' },
  { key: 'top10s', label: 'Top 10s' },
];

export function CollegeCompareSheet({ 
  isOpen, onClose, college1, college2, rivals = [], onCollegeChange 
}: CollegeCompareSheetProps) {
  const [activeMetric, setActiveMetric] = useState<CompareMetric>('earnings');
  const [selectedCollege2, setSelectedCollege2] = useState(college2);
  
  const { data: allStats, isLoading: statsLoading, error: statsError } = useCollegeSeasonStats();
  const { data: collegeMap, isLoading: mediaLoading, error: mediaError } = useCollegeMediaMap();

  const { setVisible: setBottomNavVisible } = useBottomNavigation();

  // Hide bottom nav when sheet is open
  useEffect(() => {
    if (isOpen) {
      setBottomNavVisible(false);
    } else {
      setBottomNavVisible(true);
    }
    return () => setBottomNavVisible(true);
  }, [isOpen, setBottomNavVisible]);

  useEffect(() => {
    if (isOpen && college2) setSelectedCollege2(college2);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-[#F8FAFC] dark:bg-card rounded-t-2xl",
              "border-t border-border",
              "shadow-2xl shadow-black/20",
              "max-h-[85vh] overflow-hidden"
            )}
          >
            {/* Drag handle — 40×4px */}
            <div className="flex justify-center" style={{ paddingTop: '8px', paddingBottom: '4px' }}>
              <div className="rounded-full" style={{ width: '40px', height: '4px', backgroundColor: 'hsl(var(--muted-foreground) / 0.2)', borderRadius: '2px' }} />
            </div>
            
            {/* Title — 18px, weight 700 */}
            <div className="flex items-center justify-between" style={{ padding: '20px 20px 16px' }}>
              <h3 className="text-foreground" style={{ fontSize: '18px', fontWeight: 700 }}>Head to Head</h3>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                style={{ width: '36px', height: '36px' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
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
                <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
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

            {/* Rival selector */}
            {!hasError && rivals.length > 0 && (
              <div style={{ padding: '0 20px 16px' }}>
                <p className="text-muted-foreground" style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Select Rival</p>
                <div className="flex overflow-x-auto scrollbar-hide -mx-5 px-5" style={{ gap: '8px' }}>
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
            
            {/* Metric chips — 13px */}
            {!hasError && !hasNoRivals && (
              <div className="flex" style={{ padding: '0 20px 16px', gap: '8px', marginTop: '0px' }}>
                {METRICS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveMetric(key)}
                    className={cn(
                      "flex-1 flex items-center justify-center rounded-xl",
                      "transition-all min-h-[40px]",
                      "active:scale-95",
                      activeMetric === key
                        ? "bg-muted/40 text-foreground border border-transparent"
                        : "bg-card text-muted-foreground border border-border/50 hover:bg-muted/80"
                    )}
                    style={{
                      fontSize: '13px',
                      fontWeight: activeMetric === key ? 600 : 500,
                      padding: '10px 18px',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            
            {/* VS comparison */}
            {!hasError && !hasNoRivals && hasValidComparison && (
              <div className="flex items-center justify-around" style={{ padding: '0 24px', marginTop: '32px' }}>
                <CollegeSide college={media1} value={value1} metric={activeMetric} isWinner={value1 > value2} />
                <div className="text-muted-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>vs</div>
                <CollegeSide college={media2} value={value2} metric={activeMetric} isWinner={value2 > value1} />
              </div>
            )}
            
            {/* Full Comparison button */}
            {!hasError && !hasNoRivals && (
              <div style={{ padding: '24px 20px', paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
                {hasValidComparison ? (
                  <Link to={`/tourhub/college-golf/compare?c1=${college1}&c2=${selectedCollege2}`}>
                    <button
                      onClick={onClose}
                      className="w-full rounded-2xl border border-border/50 bg-card flex items-center justify-center active:scale-[0.98] transition-all text-foreground"
                      style={{ padding: '14px', fontSize: '14px', fontWeight: 600, gap: '6px' }}
                    >
                      Full Comparison
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                ) : (
                  <button className="w-full rounded-2xl border border-border/50 bg-muted text-muted-foreground" style={{ padding: '14px', fontSize: '14px', fontWeight: 600 }} disabled>
                    Select a rival to compare
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
