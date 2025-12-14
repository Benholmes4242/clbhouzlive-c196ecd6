/**
 * RegionalJourneySummary - Shows regional list progress (GB&I/Europe/USA/Worldwide)
 * This is the "Journey Summary" showing ONLY regions, not milestones
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  return (
    <button
      onClick={onClick}
      className="w-full text-left py-3 transition-colors hover:bg-white/5 -mx-2 px-2 rounded-lg"
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--dgp-text-primary)' }}
        >
          {region.name}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: isComplete
                ? 'rgba(200, 176, 106, 0.2)'
                : region.played > 0
                ? 'rgba(110, 146, 119, 0.2)'
                : 'var(--dgp-glass-surface)',
              color: isComplete
                ? 'var(--dgp-accent-gold)'
                : region.played > 0
                ? 'var(--dgp-accent-green)'
                : 'var(--dgp-text-muted)',
            }}
          >
            {isComplete ? 'Complete' : region.played > 0 ? 'In progress' : 'Not started'}
          </span>
          <span
            className="text-sm"
            style={{ color: 'var(--dgp-text-muted)' }}
          >
            {region.played} / {region.total}
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--dgp-text-muted)' }} />
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--dgp-glass-surface)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPercent}%`,
            background: isComplete
              ? 'var(--dgp-accent-gold)'
              : 'var(--dgp-accent-green)',
          }}
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
        className="text-sm font-semibold uppercase tracking-wider mb-4 px-1"
        style={{ color: 'var(--dgp-text-secondary)' }}
      >
        Journey Summary
      </h2>

      <div className="dgp-glass rounded-xl p-4">
        <div className="divide-y" style={{ borderColor: 'var(--dgp-divider)' }}>
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
