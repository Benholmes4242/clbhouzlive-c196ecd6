import React from 'react';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface FriendsSnapshotCardProps {
  timeframe: string;
  totalCourses: number;
  totalRegions: number;
  averageRating: number | null;
  totalRounds: number;
}

const FriendsSnapshotCard: React.FC<FriendsSnapshotCardProps> = ({
  timeframe,
  totalCourses,
  totalRegions,
  averageRating,
  totalRounds,
}) => {
  const getTimeLabel = () => {
    switch (timeframe) {
      case '7d': return '7 days';
      case '30d': return '30 days';
      case '90d': return '90 days';
      case '12m': return '12 months';
      case 'all': return 'all time';
      default: return timeframe;
    }
  };

  const getSubtitle = () => {
    if (timeframe === 'all') {
      return 'Your friends have played…';
    }
    return `In the last ${getTimeLabel()} your friends played…`;
  };

  return (
    <Card className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Friends' Courses</h3>
            <p className="text-sm text-muted-foreground">{getSubtitle()}</p>
          </div>
        </div>

        {/* Stats Grid - 2×2 layout */}
        <div className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
          {/* Row 1: Courses / Regions */}
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Courses
            </span>
            <span className="font-medium">
              {totalCourses} course{totalCourses !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Regions
            </span>
            <span className="font-medium">
              {totalRegions} region{totalRegions !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Row 2: Average rating / Rounds */}
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Average rating
            </span>
            <span className="font-medium">
              {averageRating ? `${averageRating.toFixed(1)}/10` : "—"}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Rounds
            </span>
            <span className="font-medium">
              {totalRounds} round{totalRounds !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FriendsSnapshotCard;
