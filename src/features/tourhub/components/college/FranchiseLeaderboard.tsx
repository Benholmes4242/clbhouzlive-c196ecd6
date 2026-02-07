/**
 * FranchiseLeaderboard - Premium college leaderboard with franchise cards
 * 
 * Features:
 * - Glass bar tabs with sliding underline
 * - Franchise cards with medallion + performance ring
 * - Status badges (hot streak, defending champ, rising)
 * - Momentum rings showing weekly movement
 * - URL-persisted active tab
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { useCollegeStatusMap, useTopMovers } from '../../hooks/useCollegeStatus';
import { FranchiseCard } from './FranchiseCard';

type MetricTab = 'earnings' | 'wins' | 'cuts' | 'top10s';

const METRIC_TABS: { value: MetricTab; label: string }[] = [
  { value: 'earnings', label: 'Earnings' },
  { value: 'wins', label: 'Wins' },
  { value: 'cuts', label: 'Cuts' },
  { value: 'top10s', label: 'Top 10s' },
];

const VALID_METRICS = new Set<string>(['earnings', 'wins', 'cuts', 'top10s']);

interface FranchiseLeaderboardProps {
  limit?: number;
  className?: string;
}

export function FranchiseLeaderboard({ limit = 25, className }: FranchiseLeaderboardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortParam = searchParams.get('sort') || 'earnings';
  const activeMetric: MetricTab = VALID_METRICS.has(sortParam) ? (sortParam as MetricTab) : 'earnings';

  const setActiveMetric = (metric: MetricTab) => {
    const params = new URLSearchParams(searchParams);
    if (metric === 'earnings') params.delete('sort');
    else params.set('sort', metric);
    setSearchParams(params, { replace: true });
  };

  const { data: allStats, isLoading, error } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();
  const statusMap = useCollegeStatusMap();
  const { data: moverInfo } = useTopMovers();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Update indicator position
  useEffect(() => {
    if (!containerRef.current) return;
    
    const activeButton = containerRef.current.querySelector(`[data-tab="${activeMetric}"]`) as HTMLElement;
    if (activeButton) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [activeMetric]);
  
  // Sort ALL colleges by selected metric, then take top N
  const { sortedStats, maxValue } = useMemo(() => {
    if (!allStats) return { sortedStats: [], maxValue: 1 };
    
    const getValue = (s: CollegeSeasonStats) => {
      switch (activeMetric) {
        case 'wins': return s.wins_total;
        case 'cuts': return s.cuts_total;
        case 'top10s': return s.top10_total;
        default: return s.earnings_total;
      }
    };
    
    const sorted = [...allStats]
      .sort((a, b) => getValue(b) - getValue(a))
      .slice(0, limit);
    
    const max = sorted.length > 0 ? getValue(sorted[0]) : 1;
    
    return { sortedStats: sorted, maxValue: max };
  }, [allStats, activeMetric, limit]);
  
  return (
    <div className={cn('', className)}>
      {/* Glass Bar Tabs */}
      <div 
        className={cn(
          "relative mb-6",
          "bg-background/60 backdrop-blur-md",
          "border border-border/40",
          "rounded-xl",
          "p-1"
        )}
      >
        <div
          ref={containerRef}
          className="relative flex"
          role="tablist"
          aria-label="College leaderboard metrics"
        >
          {/* Sliding indicator */}
          <motion.div
            className={cn(
              "absolute bottom-0 h-[2px] rounded-full",
              "bg-[hsl(var(--tab-orange))]",
              "shadow-[0_0_8px_hsl(var(--tab-orange)/0.4)]"
            )}
            initial={false}
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />

          {METRIC_TABS.map(({ value, label }) => {
            const isSelected = activeMetric === value;
            return (
              <button
                key={value}
                data-tab={value}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveMetric(value)}
                className={cn(
                  "relative flex-1 px-3 py-2.5",
                  "text-sm font-medium",
                  "transition-colors duration-200",
                  "rounded-lg",
                  "active:scale-95",
                  isSelected 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground/80"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Leaderboard List */}
      <div className="space-y-2">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i}
              className="h-[76px] bg-card/50 border border-border/30 rounded-xl animate-pulse"
            />
          ))
        ) : error ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Failed to load leaderboard
          </div>
        ) : sortedStats.length > 0 ? (
          sortedStats.map((collegeStats, index) => {
            const status = statusMap.get(collegeStats.normalized_name) || null;
            const moverData = moverInfo?.moverData?.get(collegeStats.normalized_name);
            const momentum = moverData ? {
              rankChange: moverData.rankChange,
              earningsDelta: moverData.earningsDelta,
              isRising: moverData.earningsDelta > 0 || (moverData.rankChange !== null && moverData.rankChange > 0),
            } : null;
            
            return (
              <FranchiseCard
                key={collegeStats.normalized_name}
                stats={collegeStats}
                college={collegeMap?.get(collegeStats.normalized_name) || null}
                rank={index + 1}
                maxValue={maxValue}
                activeMetric={activeMetric}
                status={status}
                momentum={momentum}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center py-12 text-center">
            <Loader2 className="w-5 h-5 text-muted-foreground/50 animate-spin mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Season stats are being calculated</p>
            <p className="text-xs text-muted-foreground">Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
