/**
 * CollegeCompareSheet - Bottom sheet for quick college comparison
 * Uses canonical BottomSheet component for consistent UX
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Users, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from '../../hooks/useCollegeMedia';

type CompareMetric = 'earnings' | 'wins' | 'top10s';

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
  const logoUrl = getCollegeLogoUrl(college?.college_name || displayName);
  
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
        {logoUrl ? (
          <img 
            src={logoUrl} 
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
      
      {/* Stat value — system font, tabular-nums, 22px, weight 800 */}
      <motion.div
        key={`${college?.normalized_name}-${metric}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{
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
  const logoUrl = getCollegeLogoUrl(college?.college_name || displayName);
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 flex items-center rounded-xl",
        "transition-all duration-200",
        "active:scale-95 min-h-[44px]",
      )}
      style={{
        padding: '10px 16px',
        gap: '8px',
        background: isSelected ? 'hsl(var(--accent-amber) / 0.10)' : 'hsl(var(--card))',
        border: isSelected
          ? '1.5px solid hsl(var(--accent-amber) / 0.40)'
          : '1px solid hsl(var(--border) / 0.5)',
      }}
    >
      {/* College logo — 24×24px */}
      <div className="flex items-center justify-center overflow-hidden" style={{ width: '24px', height: '24px' }}>
        {logoUrl ? (
          <img src={logoUrl} alt={displayName} className="w-6 h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <span className="text-xs font-bold text-muted-foreground">{displayName.charAt(0)}</span>
        )}
      </div>
      
      <span className="whitespace-nowrap text-foreground" style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500 }}>
        {displayName}
      </span>
      
      {isSelected && <Check className="w-4 h-4" style={{ color: 'hsl(var(--accent-amber))' }} />}
    </button>
  );
}

const METRICS: { key: CompareMetric; label: string }[] = [
  { key: 'earnings', label: 'Earnings' },
  { key: 'wins', label: 'Wins' },
  { key: 'top10s', label: 'Top 10s' },
];

export function CollegeCompareSheet({ 
  isOpen, onClose, college1, college2, rivals = [], onCollegeChange 
}: CollegeCompareSheetProps) {
  const [activeMetric, setActiveMetric] = useState<CompareMetric>('earnings');
  const [selectedCollege2, setSelectedCollege2] = useState(college2);
  
  const { data: allStats, isLoading: statsLoading, error: statsError } = useCollegeSeasonStats();
  const { data: collegeMap, isLoading: mediaLoading, error: mediaError } = useCollegeMediaMap();

  useEffect(() => {
    if (isOpen && college2) setSelectedCollege2(college2);
  }, [college2, isOpen]);

  const stats1 = allStats?.find(s => s.normalized_name === college1);
  const stats2 = allStats?.find(s => s.normalized_name === selectedCollege2);
  const media1 = collegeMap?.get(college1) || null;
  const media2 = collegeMap?.get(selectedCollege2) || null;

  const hasError = !!(statsError || mediaError);
  const hasNoRivals = rivals.length === 0;

  const getValue = (stats: typeof stats1, metric: CompareMetric): number => {
    if (!stats) return 0;
    switch (metric) {
      case 'earnings': return stats.earnings_total;
      case 'wins': return stats.wins_total;
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
    <BottomSheet open={isOpen} onClose={onClose} ariaLabelledBy="compare-sheet-title">
      {/* Header */}
      <div style={{ padding: '8px 20px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--accent-amber))', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 4 }}>
          College Golf
        </div>
        <h3
          id="compare-sheet-title"
          style={{ fontSize: 20, fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em', margin: 0 }}
        >
          Head to Head
        </h3>
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
          <p className="text-muted-foreground/60" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: '10px' }}>Select Rival</p>
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
      
      {/* Metric chips — card-style tiles matching Leaders category sheet */}
      {!hasError && !hasNoRivals && (
        <div className="flex" style={{ padding: '0 20px 16px', gap: '8px' }}>
          {METRICS.map(({ key, label }) => {
            const isActive = activeMetric === key;
            return (
              <button
                key={key}
                onClick={() => setActiveMetric(key)}
                className="flex-1 flex items-center justify-center transition-all duration-150 active:scale-[0.97]"
                style={{
                  minHeight: 40,
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  padding: '10px 16px',
                  background: isActive ? 'hsl(var(--accent-amber) / 0.10)' : 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  border: isActive
                    ? '1.5px solid hsl(var(--accent-amber) / 0.40)'
                    : '1px solid hsl(var(--border) / 0.5)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      
      {/* VS comparison */}
      {!hasError && !hasNoRivals && hasValidComparison && (
        <div className="flex items-center justify-around" style={{ padding: '0 24px', marginTop: 24 }}>
          <CollegeSide college={media1} value={value1} metric={activeMetric} isWinner={value1 > value2} />
          <div className="text-muted-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>vs</div>
          <CollegeSide college={media2} value={value2} metric={activeMetric} isWinner={value2 > value1} />
        </div>
      )}
      
      {/* Full Comparison button */}
      {!hasError && !hasNoRivals && (
        <div style={{ padding: '24px 20px 8px' }}>
          {hasValidComparison ? (
            <Link
              to={`/tourhub/college-golf/compare?c1=${college1}&c2=${selectedCollege2}`}
              onClick={onClose}
              className="w-full rounded-2xl border border-border/50 bg-card flex items-center justify-center active:scale-[0.98] transition-all text-foreground"
              style={{ padding: '14px', fontSize: '14px', fontWeight: 600, gap: '6px' }}
            >
              Full Comparison
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="w-full rounded-2xl border border-border/50 bg-muted text-muted-foreground text-center" style={{ padding: '14px', fontSize: '14px', fontWeight: 600 }}>
              Select a rival to compare
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}