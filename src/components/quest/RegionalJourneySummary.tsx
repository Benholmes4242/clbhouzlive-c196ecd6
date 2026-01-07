/**
 * RegionalJourneySummary - Shows regional list progress (GB&I/Europe/USA/Worldwide)
 * This is the "Journey Summary" showing ONLY regions, not milestones
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRegionTheme, type Top100ListSlug } from '@/lib/regionTheme';
import { cn } from '@/lib/utils';

export interface RegionProgress {
  id: string;
  name: string;
  shortName: string;
  played: number;
  total: number;
}

interface RegionalJourneySummaryProps {
  regions: RegionProgress[];
  onRegionClick?: (region: RegionProgress) => void;
}

const RegionRow: React.FC<{
  region: RegionProgress;
  onClick?: () => void;
}> = ({ region, onClick }) => {
  const progressPercent = region.total > 0 ? (region.played / region.total) * 100 : 0;
  const isComplete = region.played >= region.total && region.total > 0;
  
  // Get region-specific theme colors from the Top 100 page system
  const theme = getRegionTheme(region.id as Top100ListSlug);

  return (
    <button
      onClick={onClick}
      className="w-full text-left py-4 transition-all hover:bg-slate-50/80 group"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          {/* Region color indicator */}
          <div 
            className={cn("w-2 h-2 rounded-full", theme.barClass)}
            style={{ opacity: region.played > 0 ? 1 : 0.4 }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--quest-text-primary)' }}
          >
            {region.name}
          </span>
        </div>
        <div className="flex items-center">
          {/* Fixed-width container for pill to keep alignment consistent */}
          <div className="w-[90px] flex justify-end">
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full transition-all whitespace-nowrap"
              style={{
                background: isComplete
                  ? 'rgba(210, 180, 97, 0.15)'
                  : region.played > 0
                  ? 'rgba(247, 147, 30, 0.12)'
                  : 'var(--quest-pill-inactive)',
                border: isComplete
                  ? '1px solid rgba(210, 180, 97, 0.3)'
                  : region.played > 0
                  ? '1px solid rgba(247, 147, 30, 0.2)'
                  : '1px solid var(--quest-stroke)',
                color: isComplete
                  ? '#B8A053'
                  : region.played > 0
                  ? '#C97A1A'
                  : 'var(--quest-text-tertiary)',
              }}
            >
              {isComplete ? '✓ Complete' : region.played > 0 ? 'In progress' : 'Not started'}
            </span>
          </div>
          {/* Fixed-width container for counter to accommodate 100/100 */}
          <span
            className="w-[60px] text-right text-sm font-medium tabular-nums"
            style={{ color: 'var(--quest-text-secondary)' }}
          >
            {region.played}/{region.total}
          </span>
          <ChevronRight 
            className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" 
            style={{ color: 'var(--quest-text-tertiary)' }} 
          />
        </div>
      </div>

      {/* Progress bar - uses region-specific colors from Top 100 theme system */}
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--quest-track)' }}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            theme.barClass,
            isComplete && "animate-quest-glow"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </button>
  );
};

// Map region IDs to their Top 100 page routes
const REGION_ROUTES: Record<string, string> = {
  'gb-i': '/top100/gb-i',
  'europe': '/top100/europe',
  'usa': '/top100/usa',
  'global': '/top100/global',
};

export const RegionalJourneySummary: React.FC<RegionalJourneySummaryProps> = ({
  regions,
}) => {
  const navigate = useNavigate();

  // Navigate directly to the Top 100 page for that region
  const handleRegionClick = (region: RegionProgress) => {
    const route = REGION_ROUTES[region.id];
    if (route) {
      navigate(route);
    }
  };

  return (
    <section>
      {/* Section header - mb-4 */}
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
        Regional Progress
      </h2>

      {/* Region rows - py-4 each, border-b dividers */}
      <div>
        {regions.map((region, index) => (
          <React.Fragment key={region.id}>
            <RegionRow
              region={region}
              onClick={() => handleRegionClick(region)}
            />
            {index < regions.length - 1 && (
              <div className="h-px bg-slate-200/60" />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default RegionalJourneySummary;
