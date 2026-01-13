/**
 * CollegeCompareSheet - Bottom sheet for quick college comparison
 * 
 * Shows:
 * - Both logos with rings
 * - 4 metric tabs (earnings/wins/cuts/top10s)
 * - Winner highlight per tab
 * - Deep link to full compare page
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, DollarSign, Scissors, Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from '../../hooks/useCollegeMedia';

type CompareMetric = 'earnings' | 'wins' | 'cuts' | 'top10s';

interface CollegeCompareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  college1: string; // normalized_name
  college2: string; // normalized_name
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
      {/* Logo with ring */}
      <div className={cn(
        "relative w-16 h-16 rounded-full mb-3",
        "bg-background border-2",
        isWinner ? "border-primary shadow-lg shadow-primary/20" : "border-border/50",
        "flex items-center justify-center overflow-hidden",
        "transition-all duration-300"
      )}>
        {/* Winner glow */}
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
      
      {/* Name */}
      <h4 className="text-sm font-medium text-foreground text-center mb-2 line-clamp-1">
        {displayName}
      </h4>
      
      {/* Value */}
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

const METRICS: { key: CompareMetric; label: string; icon: React.ElementType }[] = [
  { key: 'earnings', label: 'Earnings', icon: DollarSign },
  { key: 'wins', label: 'Wins', icon: Trophy },
  { key: 'cuts', label: 'Cuts', icon: Scissors },
  { key: 'top10s', label: 'Top 10s', icon: Target },
];

export function CollegeCompareSheet({ isOpen, onClose, college1, college2 }: CollegeCompareSheetProps) {
  const [activeMetric, setActiveMetric] = useState<CompareMetric>('earnings');
  const { data: allStats } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();

  const stats1 = allStats?.find(s => s.normalized_name === college1);
  const stats2 = allStats?.find(s => s.normalized_name === college2);
  const media1 = collegeMap?.get(college1) || null;
  const media2 = collegeMap?.get(college2) || null;

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-background rounded-t-3xl",
              "border-t border-border/50",
              "shadow-2xl shadow-black/20",
              "max-h-[80vh] overflow-hidden"
            )}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4">
              <h3 className="text-lg font-semibold text-foreground">Head to Head</h3>
              <button
                onClick={onClose}
                className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Metric Tabs */}
            <div className="flex gap-2 px-4 pb-4">
              {METRICS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveMetric(key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg",
                    "text-xs font-medium transition-all",
                    activeMetric === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
            
            {/* Comparison */}
            <div className="flex items-center justify-around px-6 py-6">
              <CollegeSide
                college={media1}
                value={value1}
                metric={activeMetric}
                isWinner={value1 > value2}
              />
              
              {/* VS Badge */}
              <div className="mx-4 px-3 py-1.5 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                VS
              </div>
              
              <CollegeSide
                college={media2}
                value={value2}
                metric={activeMetric}
                isWinner={value2 > value1}
              />
            </div>
            
            {/* CTA */}
            <div className="px-4 pb-8">
              <Link to={`/tourhub/college-golf/compare?c1=${college1}&c2=${college2}`}>
                <Button className="w-full gap-2" onClick={onClose}>
                  Full Comparison
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
