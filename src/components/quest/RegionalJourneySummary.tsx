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
      className="w-full text-left py-3 transition-colors hover:bg-black/[0.03] -mx-2 px-2 rounded-lg"
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--quest-text-primary)' }}
        >
          {region.name}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: isComplete
                ? 'rgba(210, 180, 97, 0.18)'
                : region.played > 0
                ? 'rgba(247, 147, 30, 0.16)'
                : 'var(--quest-pill-inactive)',
              border: isComplete
                ? '1px solid rgba(210, 180, 97, 0.35)'
                : region.played > 0
                ? '1px solid rgba(247, 147, 30, 0.26)'
                : '1px solid var(--quest-stroke)',
              color: isComplete
                ? '#B8A053'
                : region.played > 0
                ? 'var(--quest-text-primary)'
                : 'var(--quest-text-tertiary)',
            }}
          >
            {isComplete ? 'Complete' : region.played > 0 ? 'In progress' : 'Not started'}
          </span>
          <span
            className="text-sm"
            style={{ color: 'var(--quest-text-tertiary)' }}
          >
            {region.played} / {region.total}
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--quest-text-tertiary)' }} />
        </div>
      </div>

      {/* Progress bar - uses region-specific colors from Top 100 theme system */}
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--quest-track)' }}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", theme.barClass)}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </button>
  );
};

export const RegionalJourneySummary: React.FC<RegionalJourneySummaryProps> = ({
  regions,
  onRegionClick,
}) => {
  const navigate = useNavigate();

  const handleRegionClick = (region: RegionProgress) => {
    if (onRegionClick) {
      onRegionClick(region);
    } else {
      // Default: navigate to Top 100 list filtered to that region
      navigate(`/top100?tab=my-progress&region=${region.id}`);
    }
  };

  return (
    <section>
      <h2
        className="text-sm font-semibold uppercase tracking-wider mb-4 px-1 quest-section-title"
        style={{ color: 'var(--quest-text-secondary)' }}
      >
        Journey Summary
      </h2>

      <div 
        className="quest-card rounded-xl p-4"
        style={{
          background: 'var(--quest-card)',
          border: '1px solid var(--quest-stroke)',
          boxShadow: 'var(--quest-shadow)',
        }}
      >
        <div className="divide-y" style={{ borderColor: 'var(--quest-hairline)' }}>
          {regions.map(region => (
            <RegionRow
              key={region.id}
              region={region}
              onClick={() => handleRegionClick(region)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegionalJourneySummary;
