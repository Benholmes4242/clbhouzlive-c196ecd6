import React from 'react';
import { ChevronRight } from 'lucide-react';

interface FriendsCoursesSnapshotProps {
  periodLabel: string;
  coursesCount: number;
  regionsCount: number;
  avgRating: number | null;
  roundsCount: number;
  onViewDetails?: () => void;
}

const FriendsCoursesSnapshot: React.FC<FriendsCoursesSnapshotProps> = ({
  periodLabel,
  coursesCount,
  regionsCount,
  avgRating,
  roundsCount,
  onViewDetails,
}) => {
  return (
    <div className="rounded-sq-md bg-card/50 border border-border/20 shadow-sm p-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Your friends' {periodLabel.toLowerCase()}
        </span>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            View details
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stat grid */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
            Courses
          </div>
          <div className="text-lg font-semibold text-foreground">{coursesCount}</div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
            Regions
          </div>
          <div className="text-lg font-semibold text-foreground">{regionsCount}</div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
            Avg rating
          </div>
          <div className="text-lg font-semibold text-foreground">
            {avgRating ? avgRating.toFixed(1) : '—'}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
            Rounds
          </div>
          <div className="text-lg font-semibold text-foreground">{roundsCount}</div>
        </div>
      </div>
    </div>
  );
};

export default FriendsCoursesSnapshot;
