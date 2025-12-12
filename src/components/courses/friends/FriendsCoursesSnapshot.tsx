import React from 'react';
import { ChevronRight, Users } from 'lucide-react';

interface FriendsCoursesSnapshotProps {
  periodLabel: string;
  coursesCount: number;
  regionsCount: number;
  avgRating: number | null;
  roundsCount: number;
  onViewDetails?: () => void;
}

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="text-center">
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
      {label}
    </div>
    <div className="text-lg font-semibold text-foreground">{value}</div>
  </div>
);

const FriendsCoursesSnapshot: React.FC<FriendsCoursesSnapshotProps> = ({
  periodLabel,
  coursesCount,
  regionsCount,
  avgRating,
  roundsCount,
  onViewDetails,
}) => {
  return (
    <div className="w-full border border-border/20 bg-card rounded-none p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div className="font-semibold text-foreground">Your friends' {periodLabel}</div>
        </div>

        <span className="px-3 py-1 text-xs border border-border/30 bg-muted/30 rounded-full capitalize">
          {periodLabel}
        </span>
      </div>

      {/* Stat grid - centered */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <Stat label="Courses" value={coursesCount} />
        <Stat label="Regions" value={regionsCount} />
        <Stat label="Avg rating" value={avgRating ? avgRating.toFixed(1) : '—'} />
        <Stat label="Rounds" value={roundsCount} />
      </div>

      {/* Optional View details link */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View details
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default FriendsCoursesSnapshot;
