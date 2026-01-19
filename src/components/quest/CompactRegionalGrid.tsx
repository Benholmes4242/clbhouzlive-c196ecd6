/**
 * CompactRegionalGrid - 2x2 grid for regional progress
 * Replaces tall stacked region cards - 30% height reduction per tile
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Lock, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRegionTheme, type Top100ListSlug } from '@/lib/regionTheme';
import { cn } from '@/lib/utils';

interface RegionProgress {
  id: string;
  name: string;
  shortName: string;
  played: number;
  total: number;
}

interface CompactRegionalGridProps {
  regions: RegionProgress[];
}

// Map region IDs to their Top 100 page routes
const REGION_ROUTES: Record<string, string> = {
  'gb-i': '/top100/gb-i',
  'europe': '/top100/europe',
  'usa': '/top100/usa',
  'global': '/top100/global',
};

const RegionTile: React.FC<{
  region: RegionProgress;
  index: number;
  onClick: () => void;
}> = ({ region, index, onClick }) => {
  const progressPercent = region.total > 0 ? (region.played / region.total) * 100 : 0;
  const isComplete = region.played >= region.total && region.total > 0;
  const isStarted = region.played > 0;
  const theme = getRegionTheme(region.id as Top100ListSlug);

  return (
    <motion.button
      className="relative bg-white rounded-lg border border-slate-200/70 p-2.5 text-left transition-all hover:shadow-md hover:border-slate-300/80 active:scale-[0.98]"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      style={{
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      }}
    >
      {/* Top row: Name + Status */}
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <div 
            className={cn("w-2 h-2 rounded-full", theme.barClass)}
            style={{ opacity: isStarted ? 1 : 0.4 }}
          />
          <span className="text-xs font-semibold text-slate-800 truncate">
            {region.shortName}
          </span>
        </div>
        
        {/* Status icon */}
        <div 
          className={cn(
            "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
            isComplete ? "bg-green-50" : isStarted ? "bg-amber-50" : "bg-slate-100"
          )}
        >
          {isComplete ? (
            <Check className="w-2.5 h-2.5 text-green-600" />
          ) : isStarted ? (
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          ) : (
            <Lock className="w-2 h-2 text-slate-400" />
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-lg font-bold text-slate-800 mb-1.5 tabular-nums">
        {region.played}<span className="text-slate-400 text-sm font-medium">/{region.total}</span>
      </p>

      {/* Mini progress bar */}
      <div className="h-1 rounded-full bg-slate-100 overflow-hidden mb-1.5">
        <motion.div
          className={cn("h-full rounded-full", theme.barClass)}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ delay: 0.2 + index * 0.05, duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Status pill */}
      <div className="flex items-center justify-between">
        <span 
          className={cn(
            "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
            isComplete ? "bg-green-50 text-green-700" :
            isStarted ? "bg-amber-50 text-amber-700" :
            "bg-slate-100 text-slate-500"
          )}
        >
          {isComplete ? 'Complete' : isStarted ? 'In progress' : 'Not started'}
        </span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
      </div>
    </motion.button>
  );
};

export const CompactRegionalGrid: React.FC<CompactRegionalGridProps> = ({
  regions,
}) => {
  const navigate = useNavigate();

  if (!regions || regions.length === 0) return null;

  const handleRegionClick = (region: RegionProgress) => {
    const route = REGION_ROUTES[region.id];
    if (route) navigate(route);
  };

  return (
    <section>
      <h2 className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400 mb-2.5">
        Regional Progress
      </h2>
      
      <div className="grid grid-cols-2 gap-2">
        {regions.map((region, index) => (
          <RegionTile
            key={region.id}
            region={region}
            index={index}
            onClick={() => handleRegionClick(region)}
          />
        ))}
      </div>
    </section>
  );
};

export default CompactRegionalGrid;
