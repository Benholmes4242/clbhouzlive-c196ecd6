/**
 * StatsCategoryGrid - Apple-grade Stats Category Navigation
 * 
 * Phase 5: Visual category tiles for stats navigation in Leaders tab
 * Features:
 * - Grouped categories (Season Performance, Ball Striking, Short Game)
 * - Glassmorphic category tiles with icons
 * - Active state with glow effect
 * - Smooth transitions between categories
 */

import { motion } from 'framer-motion';
import { 
  Trophy, 
  Calendar, 
  DollarSign, 
  Globe, 
  Zap, 
  Crosshair, 
  Circle, 
  Flag, 
  Sun, 
  RefreshCw,
  Scissors,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryConfig {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  section: 'season' | 'stats';
}

const CATEGORIES: CategoryConfig[] = [
  // Season Performance
  { key: 'world_rank', label: 'World Ranking', shortLabel: 'World', icon: <Globe className="w-4 h-4" />, section: 'season' },
  { key: 'events_played', label: 'Events Played', shortLabel: 'Events', icon: <Calendar className="w-4 h-4" />, section: 'season' },
  { key: 'cuts_made', label: 'Cuts Made', shortLabel: 'Cuts', icon: <Scissors className="w-4 h-4" />, section: 'season' },
  { key: 'top_10', label: 'Top 10 Finishes', shortLabel: 'Top 10s', icon: <Trophy className="w-4 h-4" />, section: 'season' },
  { key: 'earnings', label: 'Season Earnings', shortLabel: 'Earnings', icon: <DollarSign className="w-4 h-4" />, section: 'season' },
  
  // Ball Striking & Short Game
  { key: 'scoring_avg', label: 'Scoring Average', shortLabel: 'Scoring', icon: <Gauge className="w-4 h-4" />, section: 'stats' },
  { key: 'drive_avg', label: 'Driving Distance', shortLabel: 'Distance', icon: <Zap className="w-4 h-4" />, section: 'stats' },
  { key: 'drive_acc', label: 'Driving Accuracy', shortLabel: 'Accuracy', icon: <Crosshair className="w-4 h-4" />, section: 'stats' },
  { key: 'gir_pct', label: 'Greens in Regulation', shortLabel: 'GIR', icon: <Circle className="w-4 h-4" />, section: 'stats' },
  { key: 'putt_avg', label: 'Putting Average', shortLabel: 'Putting', icon: <Flag className="w-4 h-4" />, section: 'stats' },
  { key: 'sand_saves_pct', label: 'Sand Saves', shortLabel: 'Sand', icon: <Sun className="w-4 h-4" />, section: 'stats' },
  { key: 'scrambling_pct', label: 'Scrambling', shortLabel: 'Scramble', icon: <RefreshCw className="w-4 h-4" />, section: 'stats' },
];

interface StatsCategoryGridProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  variant?: 'light' | 'dark';
  className?: string;
}

function CategoryTile({ 
  category, 
  isActive, 
  onClick,
  variant = 'dark'
}: { 
  category: CategoryConfig; 
  isActive: boolean; 
  onClick: () => void;
  variant?: 'light' | 'dark';
}) {
  const isDark = variant === 'dark';
  
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2.5 rounded-xl",
        "transition-all duration-300",
        "min-w-[90px] justify-center",
        isActive 
          ? isDark
            ? "bg-white text-zinc-900 shadow-lg shadow-white/20"
            : "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
          : isDark
            ? "bg-white/10 text-white/80 hover:bg-white/15 hover:text-white border border-white/10"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
      )}
    >
      {/* Icon */}
      <span className={cn(
        "transition-colors",
        isActive 
          ? isDark ? "text-zinc-900" : "text-primary-foreground" 
          : isDark ? "text-white/60" : "text-slate-500"
      )}>
        {category.icon}
      </span>
      
      {/* Label */}
      <span className="text-sm font-semibold whitespace-nowrap">
        {category.shortLabel}
      </span>
      
      {/* Active Glow */}
      {isActive && (
        <motion.div
          layoutId="categoryGlow"
          className={cn(
            "absolute inset-0 rounded-xl -z-10",
            isDark ? "bg-white/20" : "bg-primary/20"
          )}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </motion.button>
  );
}

export function StatsCategoryGrid({ 
  selectedCategory, 
  onCategoryChange,
  variant = 'light',
  className 
}: StatsCategoryGridProps) {
  const isDark = variant === 'dark';
  const seasonCategories = CATEGORIES.filter(c => c.section === 'season');
  const statsCategories = CATEGORIES.filter(c => c.section === 'stats');
  
  return (
    <div className={cn("space-y-5", className)}>
      {/* Season Performance Section */}
      <div className="space-y-2">
        <p 
          className={cn(
            "font-bold uppercase text-xs tracking-wider",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          Season Performance
        </p>
        <div className="flex flex-wrap gap-2">
          {seasonCategories.map(category => (
            <CategoryTile
              key={category.key}
              category={category}
              isActive={selectedCategory === category.key}
              onClick={() => onCategoryChange(category.key)}
              variant={variant}
            />
          ))}
        </div>
      </div>
      
      {/* Ball Striking & Short Game Section */}
      <div className="space-y-2">
        <p 
          className={cn(
            "font-bold uppercase text-xs tracking-wider",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          Ball Striking & Short Game
        </p>
        <div className="flex flex-wrap gap-2">
          {statsCategories.map(category => (
            <CategoryTile
              key={category.key}
              category={category}
              isActive={selectedCategory === category.key}
              onClick={() => onCategoryChange(category.key)}
              variant={variant}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatsCategoryGrid;
