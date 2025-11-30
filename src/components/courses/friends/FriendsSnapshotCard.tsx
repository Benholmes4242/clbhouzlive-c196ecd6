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

        {/* Stats Grid - 2×2 centered layout */}
        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-center justify-items-center">
          {/* Row 1: Courses / Regions */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70">
              Courses
            </div>
            <div className="mt-1 font-medium text-foreground">
              {totalCourses} course{totalCourses !== 1 ? "s" : ""}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70">
              Regions
            </div>
            <div className="mt-1 font-medium text-foreground">
              {totalRegions} region{totalRegions !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Row 2: Average rating / Rounds */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70">
              Average rating
            </div>
            <div className="mt-1 font-medium text-foreground">
              {averageRating ? averageRating.toFixed(1) : "—"}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70">
              Rounds
            </div>
            <div className="mt-1 font-medium text-foreground">
              {totalRounds} round{totalRounds !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FriendsSnapshotCard;
